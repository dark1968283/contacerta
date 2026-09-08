-- ============================================================
-- ContaCerta — Fase 4: Vendas
-- Tabelas: sales, sale_items, debts
-- RPC: create_sale (venda paga ou a crédito, transacional)
-- ============================================================

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete restrict,
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  payment_method text not null check (payment_method in ('pago', 'credito')),
  status text not null default 'concluida' check (status in ('concluida')),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  check (payment_method = 'pago' or customer_id is not null)
);

create index idx_sales_business_created_at on public.sales (business_id, created_at desc);
create index idx_sales_business_customer on public.sales (business_id, customer_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  unique (sale_id, product_id)
);

create index idx_sale_items_sale on public.sale_items (sale_id);
create index idx_sale_items_product on public.sale_items (product_id);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  sale_id uuid not null unique references public.sales (id) on delete cascade,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0 and amount_paid <= total_amount),
  status text not null default 'pendente' check (status in ('pendente', 'parcial', 'paga', 'vencida')),
  due_date date,
  created_at timestamptz not null default now()
);

create index idx_debts_business_customer_status on public.debts (business_id, customer_id, status);

-- A função é a única via de criação de uma venda. Uma função PL/pgSQL corre
-- numa transação: qualquer exception reverte a venda, itens, stock e dívida.
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
    select 1 from public.customers
    where id = p_customer_id and business_id = p_business_id
  ) then
    raise exception 'Cliente não encontrado neste negócio';
  end if;

  insert into public.sales (business_id, customer_id, payment_method, created_by)
  values (p_business_id, p_customer_id, p_payment_method, auth.uid())
  returning * into v_sale;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when invalid_text_representation then
      raise exception 'Item de venda inválido';
    end;

    if v_product_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'Cada item precisa de produto e quantidade positiva';
    end if;

    -- O UPDATE condicional bloqueia a linha e impede stock negativo mesmo
    -- quando duas vendas concorrentes tentam vender a última unidade.
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

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
    values (v_sale.id, v_product.id, v_quantity, v_product.selling_price, v_subtotal);

    insert into public.stock_movements (
      business_id, product_id, type, quantity, note, reference_type, reference_id, created_by
    ) values (
      p_business_id, v_product.id, 'venda', -v_quantity, 'Venda', 'sale', v_sale.id, auth.uid()
    );
  end loop;

  update public.sales set total_amount = v_total where id = v_sale.id returning * into v_sale;

  if p_payment_method = 'credito' then
    insert into public.debts (business_id, customer_id, sale_id, total_amount)
    values (p_business_id, p_customer_id, v_sale.id, v_total);
  end if;

  return v_sale;
end;
$$;

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debts enable row level security;

-- Não há policies de escrita: vendas, itens e dívidas só são criados pela
-- RPC para preservar a transação e a integridade financeira.
create policy "sales_select_members" on public.sales
  for select using (public.is_member_of_business(business_id));

create policy "sale_items_select_members" on public.sale_items
  for select using (
    exists (
      select 1 from public.sales
      where sales.id = sale_items.sale_id
        and public.is_member_of_business(sales.business_id)
    )
  );

create policy "debts_select_members" on public.debts
  for select using (public.is_member_of_business(business_id));
