-- ============================================================
-- ContaCerta — Fase 8 (final): Subscription Gate
--
-- CONTEXTO: os planos e assinaturas (0006-0009) já são funcionais, mas
-- nenhuma operação de negócio verifica se a assinatura do negócio está
-- válida. Esta migration fecha essa lacuna com um "Bloqueio Suave do
-- Beta": leitura continua sempre disponível; escrita que cria/movimenta
-- dados do negócio passa a exigir uma assinatura válida.
--
-- NÃO altera nenhuma migration anterior. NÃO implementa plan limits,
-- grace period nem scheduler — isso fica para tarefas separadas
-- (ver secções 22-24 do handoff desta fase).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Funções centrais de autorização
-- ------------------------------------------------------------

-- Verdadeiro quando o negócio tem uma assinatura ativa E dentro do
-- período pago. Verifica sempre a assinatura do PRÓPRIO business_id
-- passado — quem chama é responsável por já ter confirmado que esse
-- business_id é o do utilizador autenticado (create_sale, create_product,
-- adjust_stock e register_debt_payment já fazem essa verificação de
-- membership antes de chegar aqui; ver secção 25 do handoff).
--
-- Não depende só de status = 'active': também exige current_period_end
-- > now(), porque expire_due_subscriptions() não tem scheduler
-- configurado (secção 24) — sem isto, uma assinatura vencida continuaria
-- com status 'active' indefinidamente.
create or replace function public.has_active_subscription(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where business_id = p_business_id
      and status = 'active'
      and current_period_end > now()
  );
$$;

comment on function public.has_active_subscription(uuid) is
  'Subscription Gate (Fase 8 final): true apenas quando a assinatura do negócio está active E current_period_end > now(). SECURITY DEFINER para evitar recursão de RLS — não depende de nenhuma policy para ler subscriptions.';

-- Lança exception quando o negócio não tem assinatura válida.
-- Diferencia "nunca teve assinatura" de "assinatura existe mas expirou"
-- só porque a mensagem fica mais útil para o utilizador — a lógica de
-- autorização em si é idêntica nos dois casos (has_active_subscription).
create or replace function public.require_active_subscription(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_active_subscription(p_business_id) then
    return;
  end if;

  if exists (select 1 from public.subscriptions where business_id = p_business_id) then
    raise exception 'A assinatura deste negócio expirou. Renove o plano para continuar a realizar operações.'
      using errcode = '42501';
  else
    raise exception 'Este negócio não possui uma assinatura ativa. Escolha um plano para continuar.'
      using errcode = '42501';
  end if;
end;
$$;

comment on function public.require_active_subscription(uuid) is
  'Subscription Gate (Fase 8 final): chamar no início de qualquer RPC que crie/altere dados operacionais, depois de confirmado que p_business_id pertence ao utilizador autenticado (current_user_role/is_member_of_business). Usar errcode 42501 (insufficient_privilege) para diferenciar de erros de validação de dados.';

-- ------------------------------------------------------------
-- 2. RPCs — adicionar o gate, sem alterar mais nada
-- ------------------------------------------------------------

-- create_sale: gate logo após a verificação de membership existente,
-- antes de qualquer insert de venda ou alteração de stock.
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

-- create_product: gate logo após a verificação de admin existente,
-- antes de qualquer validação/insert do produto.
create or replace function public.create_product(
  p_business_id uuid,
  p_name text,
  p_category_id uuid,
  p_cost_price numeric,
  p_selling_price numeric,
  p_initial_stock integer,
  p_low_stock_threshold integer
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
begin
  if public.current_user_role(p_business_id) is distinct from 'admin' then
    raise exception 'Apenas o administrador pode criar produtos';
  end if;

  perform public.require_active_subscription(p_business_id);

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'O nome do produto é obrigatório';
  end if;

  if p_selling_price is null or p_selling_price < 0 then
    raise exception 'O preço de venda é obrigatório e não pode ser negativo';
  end if;

  if p_cost_price is not null and p_cost_price < 0 then
    raise exception 'O custo não pode ser negativo';
  end if;

  insert into public.products (
    business_id, name, category_id, cost_price, selling_price,
    stock_quantity, low_stock_threshold
  )
  values (
    p_business_id, trim(p_name), p_category_id, p_cost_price, p_selling_price,
    greatest(coalesce(p_initial_stock, 0), 0),
    coalesce(p_low_stock_threshold, 5)
  )
  returning * into v_product;

  if coalesce(p_initial_stock, 0) > 0 then
    insert into public.stock_movements (business_id, product_id, type, quantity, note, created_by)
    values (p_business_id, v_product.id, 'entrada', p_initial_stock, 'Stock inicial', auth.uid());
  end if;

  return v_product;
end;
$$;

-- adjust_stock: o negócio é determinado a partir do produto; o gate usa
-- esse business_id real (nunca um valor recebido diretamente do cliente).
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_note text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_product public.products;
begin
  select business_id into v_business_id from public.products where id = p_product_id;

  if v_business_id is null then
    raise exception 'Produto não encontrado';
  end if;

  if public.current_user_role(v_business_id) is distinct from 'admin' then
    raise exception 'Apenas o administrador pode ajustar stock';
  end if;

  perform public.require_active_subscription(v_business_id);

  if p_type not in ('entrada', 'ajuste') then
    raise exception 'Tipo de movimento inválido para esta operação';
  end if;

  if p_type = 'entrada' and p_quantity <= 0 then
    raise exception 'Uma entrada tem de ter quantidade positiva';
  end if;

  if p_quantity = 0 then
    raise exception 'A quantidade não pode ser zero';
  end if;

  -- Padrão UPDATE...WHERE para evitar stock negativo mesmo com pedidos
  -- concorrentes — sem SELECT+IF separado, sem janela de corrida.
  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = p_product_id
    and stock_quantity + p_quantity >= 0
  returning * into v_product;

  if v_product.id is null then
    raise exception 'Stock insuficiente para este ajuste';
  end if;

  insert into public.stock_movements (business_id, product_id, type, quantity, note, created_by)
  values (v_business_id, p_product_id, p_type, p_quantity, p_note, auth.uid());

  return v_product;
end;
$$;

-- register_debt_payment: a dívida já é bloqueada (FOR UPDATE) antes do
-- gate; o gate usa o business_id real da própria dívida.
create or replace function public.register_debt_payment(
  p_debt_id uuid,
  p_amount numeric,
  p_payment_method text
)
returns public.debts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debt public.debts;
  v_remaining numeric(12, 2);
  v_new_amount_paid numeric(12, 2);
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'O pagamento deve ser maior que zero';
  end if;

  if p_payment_method not in ('dinheiro', 'mpesa', 'emola', 'transferencia', 'outro') then
    raise exception 'Método de pagamento inválido';
  end if;

  -- O lock impede que dois pagamentos concorrentes usem o mesmo saldo.
  select * into v_debt
  from public.debts
  where id = p_debt_id
  for update;

  if v_debt.id is null then
    raise exception 'Dívida não encontrada';
  end if;

  if public.current_user_role(v_debt.business_id) is null then
    raise exception 'Sem permissão para registar pagamento nesta dívida';
  end if;

  perform public.require_active_subscription(v_debt.business_id);

  if v_debt.status = 'paga' then
    raise exception 'Esta dívida já foi paga';
  end if;

  v_remaining := v_debt.total_amount - v_debt.amount_paid;
  if p_amount > v_remaining then
    raise exception 'O pagamento não pode ser superior ao saldo em aberto';
  end if;

  v_new_amount_paid := v_debt.amount_paid + p_amount;

  insert into public.debt_payments (business_id, debt_id, amount, payment_method, created_by)
  values (v_debt.business_id, v_debt.id, p_amount, p_payment_method, auth.uid());

  update public.debts
  set
    amount_paid = v_new_amount_paid,
    status = case
      when v_new_amount_paid = 0 then 'pendente'
      when v_new_amount_paid < v_debt.total_amount then 'parcial'
      else 'paga'
    end
  where id = v_debt.id
  returning * into v_debt;

  return v_debt;
end;
$$;

-- ------------------------------------------------------------
-- 3. RLS — categorias, clientes e membros
--
-- Em todos os casos: SELECT continua sem alterações (policies de
-- leitura de 0002/0001 não são tocadas). Só o INSERT/gestão passa a
-- exigir também assinatura válida, além da regra de autorização já
-- existente.
-- ------------------------------------------------------------

-- 3.1 categories — INSERT continua exigindo admin, e passa a exigir
-- também assinatura válida. UPDATE/DELETE de categoria (ex.: renomear)
-- continuam livres de gate — só a criação está no escopo desta fase.
drop policy if exists "categories_admin_manage" on public.categories;

create policy "categories_admin_update" on public.categories
  for update using (public.current_user_role(business_id) = 'admin')
  with check (public.current_user_role(business_id) = 'admin');

create policy "categories_admin_delete" on public.categories
  for delete using (public.current_user_role(business_id) = 'admin');

create policy "categories_admin_insert_subscribed" on public.categories
  for insert with check (
    public.current_user_role(business_id) = 'admin'
    and public.has_active_subscription(business_id)
  );

-- 3.2 customers — SELECT (customers_select_members) e UPDATE
-- (customers_update_admin) de 0003 não são tocadas. Só o INSERT passa a
-- exigir também assinatura válida, preservando a regra "qualquer membro
-- pode adicionar".
drop policy if exists "customers_insert_members" on public.customers;

create policy "customers_insert_members_subscribed" on public.customers
  for insert with check (
    public.is_member_of_business(business_id)
    and public.has_active_subscription(business_id)
  );

-- 3.3 business_users — SELECT (business_users_select_members) de 0001
-- não é tocada: membros continuam a ver a lista. INSERT/UPDATE/DELETE
-- (gestão de membros) passam a exigir também assinatura válida, além do
-- requisito de admin já existente.
drop policy if exists "business_users_admin_manage" on public.business_users;

create policy "business_users_admin_insert_subscribed" on public.business_users
  for insert with check (
    public.current_user_role(business_id) = 'admin'
    and public.has_active_subscription(business_id)
  );

create policy "business_users_admin_update_subscribed" on public.business_users
  for update using (
    public.current_user_role(business_id) = 'admin'
    and public.has_active_subscription(business_id)
  )
  with check (
    public.current_user_role(business_id) = 'admin'
    and public.has_active_subscription(business_id)
  );

create policy "business_users_admin_delete_subscribed" on public.business_users
  for delete using (
    public.current_user_role(business_id) = 'admin'
    and public.has_active_subscription(business_id)
  );

-- ------------------------------------------------------------
-- 4. O que este gate NÃO toca (documentado explicitamente)
--
-- - create_business_with_admin(): sem gate — o primeiro negócio precisa
--   de poder ser criado antes de existir qualquer assinatura (onboarding).
-- - create_subscription_payment(): sem gate — uma assinatura expirada
--   precisa de poder pedir renovação.
-- - confirm_subscription_payment(), expire_due_subscriptions(), gestão
--   de planos e Platform Admin em geral: sem gate — dependem apenas de
--   is_platform_admin(), nunca da assinatura do negócio.
-- - Todas as policies de SELECT (dashboard, produtos, clientes, vendas,
--   dívidas, stock, plano, pagamentos): sem gate — leitura continua
--   sempre disponível, mesmo com assinatura expirada.
-- ------------------------------------------------------------
