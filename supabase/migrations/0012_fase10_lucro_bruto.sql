-- ============================================================
-- ContaCerta — Fase 10: Lucro Bruto
-- Migration: 0012_fase10_lucro_bruto.sql
--
-- Objetivo:
-- - Guardar o custo do produto no momento da venda.
-- - Preservar o histórico correto das novas vendas.
-- - Manter vendas antigas com custo desconhecido como NULL.
-- - Permitir cálculo correto do lucro bruto.
--
-- Regra:
-- - cost_price NULL = venda fora do cálculo de lucro bruto.
-- - cost_price conhecido = subtotal - (quantidade * cost_price).
--
-- IMPORTANTE:
-- - Não altera as vendas existentes.
-- - Não tenta reconstruir custos históricos.
-- - Não torna cost_price obrigatório.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Guardar o custo no momento da venda
-- ------------------------------------------------------------

alter table public.sale_items
  add column if not exists cost_price numeric(12, 2);

alter table public.sale_items
  drop constraint if exists sale_items_cost_price_check;

alter table public.sale_items
  add constraint sale_items_cost_price_check
  check (cost_price is null or cost_price >= 0);


-- ------------------------------------------------------------
-- 2. Atualizar create_sale
--
-- O custo é lido do produto no mesmo momento em que:
-- - o stock é atualizado;
-- - o preço de venda é obtido;
-- - o item da venda é criado.
--
-- Vendas antigas permanecem com cost_price = NULL.
-- ------------------------------------------------------------

create or replace function public.create_sale(
  p_business_id uuid,
  p_payment_method text,
  p_customer_id uuid,
  p_items jsonb
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_product public.products;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2) := 0;
begin
  if public.current_user_role(p_business_id) is null then
    raise exception 'Sem permissão para registar vendas neste negócio';
  end if;

  perform public.require_active_subscription(p_business_id);

  if p_payment_method not in ('pago', 'credito') then
    raise exception 'Método de pagamento inválido';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda deve ter pelo menos um item';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    group by item ->> 'product_id'
    having count(*) > 1
  ) then
    raise exception 'Cada produto só pode aparecer uma vez na venda';
  end if;

  if p_payment_method = 'credito' and p_customer_id is null then
    raise exception 'Uma venda a crédito exige um cliente';
  end if;

  if p_customer_id is not null and not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and business_id = p_business_id
  ) then
    raise exception 'Cliente não encontrado neste negócio';
  end if;

  insert into public.sales (
    business_id,
    customer_id,
    payment_method,
    created_by
  )
  values (
    p_business_id,
    p_customer_id,
    p_payment_method,
    auth.uid()
  )
  returning * into v_sale;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    exception
      when invalid_text_representation then
        raise exception 'Item de venda inválido';
    end;

    if v_product_id is null
       or v_quantity is null
       or v_quantity <= 0 then
      raise exception 'Cada item precisa de produto e quantidade positiva';
    end if;

    -- O UPDATE condicional bloqueia a linha e impede stock negativo
    -- mesmo quando duas vendas concorrentes tentam vender a última unidade.
    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id
      and business_id = p_business_id
      and is_active = true
      and stock_quantity >= v_quantity
    returning * into v_product;

    if v_product.id is null then
      raise exception 'Stock insuficiente ou produto indisponível';
    end if;

    v_subtotal := v_product.selling_price * v_quantity;
    v_total := v_total + v_subtotal;

    -- cost_price é congelado no momento da venda.
    -- Se o produto não tiver custo definido, permanece NULL.
    insert into public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      subtotal,
      cost_price
    )
    values (
      v_sale.id,
      v_product.id,
      v_quantity,
      v_product.selling_price,
      v_subtotal,
      v_product.cost_price
    );

    insert into public.stock_movements (
      business_id,
      product_id,
      type,
      quantity,
      note,
      reference_type,
      reference_id,
      created_by
    )
    values (
      p_business_id,
      v_product.id,
      'venda',
      -v_quantity,
      'Venda',
      'sale',
      v_sale.id,
      auth.uid()
    );
  end loop;

  update public.sales
  set total_amount = v_total
  where id = v_sale.id
  returning * into v_sale;

  if p_payment_method = 'credito' then
    insert into public.debts (
      business_id,
      customer_id,
      sale_id,
      total_amount
    )
    values (
      p_business_id,
      p_customer_id,
      v_sale.id,
      v_total
    );
  end if;

  return v_sale;
end;
$$;


-- ------------------------------------------------------------
-- 3. Permissões da RPC
--
-- Mantém o mesmo modelo de execução da função existente.
-- ------------------------------------------------------------

revoke execute on function public.create_sale(
  uuid,
  text,
  uuid,
  jsonb
) from public;

grant execute on function public.create_sale(
  uuid,
  text,
  uuid,
  jsonb
) to authenticated;


-- ------------------------------------------------------------
-- 4. Índice opcional para consultas de lucro
--
-- Não é necessário para o cálculo neste momento, mas ajuda
-- quando o volume de sale_items crescer.
-- ------------------------------------------------------------

create index if not exists idx_sale_items_sale_cost
  on public.sale_items (sale_id, cost_price);


-- ------------------------------------------------------------
-- 5. Verificação documental
--
-- As vendas existentes NÃO são atualizadas.
-- Portanto, os sale_items anteriores terão cost_price = NULL.
-- ------------------------------------------------------------