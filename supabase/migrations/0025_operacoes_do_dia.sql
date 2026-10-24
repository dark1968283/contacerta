-- ============================================================
-- ContaCerta — Operações do dia
-- Migration: 0025_operacoes_do_dia.sql
--
--  1. Anular venda (só o dono): o stock volta e a dívida sai.
--  2. Desconto na venda: o vendedor escreve o novo total.
--  3. Despesas ("Gastei dinheiro").
--  4. Contar a caixa no fim do dia.
--  5. Chegou mercadoria: entrada com quanto pagou e fornecedor.
--  6. Mudar o nome do negócio.
--
-- Tudo novo é acrescentado; a função create_sale não é alterada.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Vendas: estado "anulada" e desconto
-- ------------------------------------------------------------

do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.sales'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%concluida%'
  loop
    execute format('alter table public.sales drop constraint %I', c);
  end loop;
end $$;

alter table public.sales
  add constraint sales_status_check check (status in ('concluida', 'anulada'));

alter table public.sales
  add column if not exists discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.users (id),
  add column if not exists cancel_reason text;

-- Movimentos de stock: novo tipo "anulacao" e dados da compra.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.stock_movements'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%type%entrada%'
  loop
    execute format('alter table public.stock_movements drop constraint %I', c);
  end loop;
end $$;

alter table public.stock_movements
  add constraint stock_movements_type_check check (type in ('entrada', 'venda', 'ajuste', 'anulacao'));

alter table public.stock_movements
  add column if not exists unit_cost numeric(12, 2),
  add column if not exists total_cost numeric(12, 2),
  add column if not exists supplier_name text;


-- ------------------------------------------------------------
-- 1b. Anular venda
-- ------------------------------------------------------------
create or replace function public.cancel_sale(p_sale_id uuid, p_reason text)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_debt public.debts;
  v_item record;
begin
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'Venda não encontrada';
  end if;

  if public.current_user_role(v_sale.business_id) is distinct from 'admin' then
    raise exception 'Só o dono do negócio pode anular vendas';
  end if;

  if v_sale.status = 'anulada' then
    return v_sale;
  end if;

  select * into v_debt from public.debts where sale_id = v_sale.id for update;
  if found and v_debt.amount_paid > 0 then
    raise exception 'O cliente já pagou % MT desta venda. Não é possível anular.', v_debt.amount_paid;
  end if;

  -- Devolve o stock de cada produto.
  for v_item in select product_id, quantity from public.sale_items where sale_id = v_sale.id loop
    update public.products
       set stock_quantity = stock_quantity + v_item.quantity
     where id = v_item.product_id;

    insert into public.stock_movements (business_id, product_id, type, quantity, note, reference_type, reference_id, created_by)
    values (v_sale.business_id, v_item.product_id, 'anulacao', v_item.quantity, 'Venda anulada', 'sale', v_sale.id, auth.uid());
  end loop;

  delete from public.debts where sale_id = v_sale.id;

  update public.sales
     set status = 'anulada',
         cancelled_at = now(),
         cancelled_by = auth.uid(),
         cancel_reason = nullif(left(trim(coalesce(p_reason, '')), 200), '')
   where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke all on function public.cancel_sale(uuid, text) from public, anon;
grant execute on function public.cancel_sale(uuid, text) to authenticated;


-- ------------------------------------------------------------
-- 2. Registar venda com desconto (usa create_sale_idempotent)
-- ------------------------------------------------------------
create or replace function public.register_sale(
  p_business_id uuid,
  p_payment_method text,
  p_customer_id uuid,
  p_items jsonb,
  p_client_ref uuid,
  p_sold_at timestamptz default null,
  p_final_total numeric default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_final numeric(12, 2);
begin
  if p_final_total is not null and p_final_total <= 0 then
    raise exception 'O total com desconto tem de ser maior que zero';
  end if;

  v_sale := public.create_sale_idempotent(
    p_business_id, p_payment_method, p_customer_id, p_items,
    coalesce(p_client_ref, gen_random_uuid()), p_sold_at
  );

  v_final := round(p_final_total, 2);

  -- Só aplica uma vez: se a venda já tinha o desconto, o total já é o final.
  if v_final is not null and v_final < v_sale.total_amount then
    update public.sales
       set discount_amount = total_amount - v_final,
           total_amount = v_final
     where id = v_sale.id
    returning * into v_sale;

    update public.debts
       set total_amount = v_final
     where sale_id = v_sale.id;
  end if;

  return v_sale;
end;
$$;

revoke all on function public.register_sale(uuid, text, uuid, jsonb, uuid, timestamptz, numeric) from public, anon;
grant execute on function public.register_sale(uuid, text, uuid, jsonb, uuid, timestamptz, numeric) to authenticated;


-- ------------------------------------------------------------
-- 3. Despesas
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category text not null check (category in ('renda', 'luz_agua', 'transporte', 'salarios', 'credito_megas', 'outro')),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  spent_at timestamptz not null default now(),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_business_spent on public.expenses (business_id, spent_at desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_members" on public.expenses;
create policy "expenses_select_members" on public.expenses
  for select using (public.current_user_role(business_id) is not null);

create or replace function public.add_expense(
  p_business_id uuid,
  p_category text,
  p_amount numeric,
  p_note text default null
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expenses;
begin
  if public.current_user_role(p_business_id) is null then
    raise exception 'Sem permissão neste negócio';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Escreva quanto gastou';
  end if;
  if p_category not in ('renda', 'luz_agua', 'transporte', 'salarios', 'credito_megas', 'outro') then
    raise exception 'Escolha em que gastou';
  end if;

  insert into public.expenses (business_id, category, amount, note, created_by)
  values (p_business_id, p_category, round(p_amount, 2), nullif(left(trim(coalesce(p_note, '')), 120), ''), auth.uid())
  returning * into v_row;
  return v_row;
end;
$$;

-- Apagar: o dono apaga qualquer uma; o funcionário só as suas, no próprio dia.
create or replace function public.delete_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.expenses;
  v_role text;
begin
  select * into v_row from public.expenses where id = p_expense_id;
  if not found then return; end if;
  v_role := public.current_user_role(v_row.business_id);
  if v_role = 'admin'
     or (v_role is not null and v_row.created_by = auth.uid()
         and (v_row.created_at at time zone 'Africa/Maputo')::date = (now() at time zone 'Africa/Maputo')::date) then
    delete from public.expenses where id = p_expense_id;
  else
    raise exception 'Só o dono pode apagar esta despesa';
  end if;
end;
$$;

revoke all on function public.add_expense(uuid, text, numeric, text) from public, anon;
grant execute on function public.add_expense(uuid, text, numeric, text) to authenticated;
revoke all on function public.delete_expense(uuid) from public, anon;
grant execute on function public.delete_expense(uuid) to authenticated;


-- ------------------------------------------------------------
-- 4. Contar a caixa
-- ------------------------------------------------------------
create table if not exists public.cash_counts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  day date not null,
  expected numeric(12, 2) not null,
  counted_cash numeric(12, 2) not null default 0,
  counted_mobile numeric(12, 2) not null default 0,
  difference numeric(12, 2) not null,
  note text,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  unique (business_id, day)
);

alter table public.cash_counts enable row level security;

drop policy if exists "cash_counts_select_members" on public.cash_counts;
create policy "cash_counts_select_members" on public.cash_counts
  for select using (public.current_user_role(business_id) is not null);

-- Quanto devia ter entrado hoje: vendas pagas + dívidas recebidas − despesas.
create or replace function public.cash_expected_today(p_business_id uuid)
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  with bounds as (
    select (date_trunc('day', now() at time zone 'Africa/Maputo') at time zone 'Africa/Maputo') as d0
  )
  select
    coalesce((select sum(total_amount) from public.sales, bounds
               where business_id = p_business_id and payment_method = 'pago' and status <> 'anulada'
                 and created_at >= d0 and created_at < d0 + interval '1 day'), 0)
  + coalesce((select sum(amount) from public.debt_payments, bounds
               where business_id = p_business_id
                 and created_at >= d0 and created_at < d0 + interval '1 day'), 0)
  - coalesce((select sum(amount) from public.expenses, bounds
               where business_id = p_business_id
                 and spent_at >= d0 and spent_at < d0 + interval '1 day'), 0)
  where public.current_user_role(p_business_id) is not null;
$$;

create or replace function public.save_cash_count(
  p_business_id uuid,
  p_counted_cash numeric,
  p_counted_mobile numeric,
  p_note text default null
)
returns public.cash_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected numeric(12, 2);
  v_cash numeric(12, 2) := round(greatest(coalesce(p_counted_cash, 0), 0), 2);
  v_mobile numeric(12, 2) := round(greatest(coalesce(p_counted_mobile, 0), 0), 2);
  v_row public.cash_counts;
begin
  if public.current_user_role(p_business_id) is null then
    raise exception 'Sem permissão neste negócio';
  end if;

  v_expected := coalesce(public.cash_expected_today(p_business_id), 0);

  insert into public.cash_counts (business_id, day, expected, counted_cash, counted_mobile, difference, note, created_by)
  values (p_business_id, (now() at time zone 'Africa/Maputo')::date, v_expected, v_cash, v_mobile,
          v_cash + v_mobile - v_expected, nullif(left(trim(coalesce(p_note, '')), 200), ''), auth.uid())
  on conflict (business_id, day) do update
     set expected = excluded.expected,
         counted_cash = excluded.counted_cash,
         counted_mobile = excluded.counted_mobile,
         difference = excluded.difference,
         note = excluded.note,
         created_by = excluded.created_by,
         created_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.cash_expected_today(uuid) from public, anon;
grant execute on function public.cash_expected_today(uuid) to authenticated;
revoke all on function public.save_cash_count(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.save_cash_count(uuid, numeric, numeric, text) to authenticated;


-- ------------------------------------------------------------
-- 5. Chegou mercadoria
-- ------------------------------------------------------------
create or replace function public.receive_stock(
  p_product_id uuid,
  p_quantity integer,
  p_total_paid numeric default null,
  p_supplier text default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_product public.products;
  v_unit numeric(12, 2);
  v_supplier text := nullif(left(trim(coalesce(p_supplier, '')), 80), '');
begin
  select business_id into v_business_id from public.products where id = p_product_id;
  if v_business_id is null then
    raise exception 'Produto não encontrado';
  end if;
  if public.current_user_role(v_business_id) is distinct from 'admin' then
    raise exception 'Só o dono pode registar a chegada de mercadoria';
  end if;
  perform public.require_active_subscription(v_business_id);

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Escreva quantas unidades chegaram';
  end if;
  if p_total_paid is not null and p_total_paid < 0 then
    raise exception 'O valor pago não pode ser negativo';
  end if;

  v_unit := case when p_total_paid is not null and p_total_paid > 0 then round(p_total_paid / p_quantity, 2) end;

  update public.products
     set stock_quantity = stock_quantity + p_quantity,
         cost_price = coalesce(v_unit, cost_price)
   where id = p_product_id
  returning * into v_product;

  insert into public.stock_movements (business_id, product_id, type, quantity, note, unit_cost, total_cost, supplier_name, created_by)
  values (v_business_id, p_product_id, 'entrada', p_quantity,
          case when v_supplier is null then 'Chegou mercadoria' else 'Chegou mercadoria · ' || v_supplier end,
          v_unit, case when p_total_paid > 0 then round(p_total_paid, 2) end, v_supplier, auth.uid());

  return v_product;
end;
$$;

revoke all on function public.receive_stock(uuid, integer, numeric, text) from public, anon;
grant execute on function public.receive_stock(uuid, integer, numeric, text) to authenticated;


-- ------------------------------------------------------------
-- 6. Mudar o nome do negócio
-- ------------------------------------------------------------
create or replace function public.update_business_name(p_business_id uuid, p_name text)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_business public.businesses;
begin
  if public.current_user_role(p_business_id) is distinct from 'admin' then
    raise exception 'Só o dono pode mudar o nome do negócio';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'O nome do negócio deve ter entre 2 e 80 letras';
  end if;

  update public.businesses set name = v_name where id = p_business_id
  returning * into v_business;
  return v_business;
end;
$$;

revoke all on function public.update_business_name(uuid, text) from public, anon;
grant execute on function public.update_business_name(uuid, text) to authenticated;
