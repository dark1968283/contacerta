-- ============================================================
-- ContaCerta — Faturas-recibo numeradas
-- Migration: 0021_faturas.sql
--
-- O que faz:
-- 1. Dados fiscais do negócio (NUIT, telefone, endereço) para aparecerem
--    nas faturas. Só o administrador os altera.
-- 2. Tabela invoices: uma fatura-recibo por venda, com número sequencial
--    por negócio e por ano (FR 2026/1, FR 2026/2, ...).
-- 3. issue_invoice(): emite (ou devolve a já emitida) a fatura de uma
--    venda, respeitando o limite "invoices_per_month" do plano.
--
-- Seguro de aplicar mais de uma vez (if not exists / or replace).
-- Não altera vendas nem stock.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Dados fiscais do negócio
-- ------------------------------------------------------------

alter table public.businesses add column if not exists nuit text;
alter table public.businesses add column if not exists phone text;
alter table public.businesses add column if not exists address text;

alter table public.businesses drop constraint if exists businesses_nuit_check;
alter table public.businesses
  add constraint businesses_nuit_check
  check (nuit is null or nuit ~ '^[0-9]{9}$');

create or replace function public.update_business_details(
  p_business_id uuid,
  p_nuit text,
  p_phone text,
  p_address text
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
  v_nuit text := nullif(regexp_replace(coalesce(p_nuit, ''), '\s', '', 'g'), '');
begin
  if public.current_user_role(p_business_id) is distinct from 'admin' then
    raise exception 'Só o administrador pode alterar os dados do negócio';
  end if;

  if v_nuit is not null and v_nuit !~ '^[0-9]{9}$' then
    raise exception 'O NUIT tem de ter 9 algarismos';
  end if;

  update public.businesses
  set nuit = v_nuit,
      phone = nullif(left(trim(coalesce(p_phone, '')), 30), ''),
      address = nullif(left(trim(coalesce(p_address, '')), 200), '')
  where id = p_business_id
  returning * into v_business;

  return v_business;
end;
$$;

revoke all on function public.update_business_details(uuid, text, text, text) from public, anon;
grant execute on function public.update_business_details(uuid, text, text, text) to authenticated;


-- ------------------------------------------------------------
-- 2. Faturas-recibo
-- ------------------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  sale_id uuid not null unique references public.sales (id) on delete restrict,
  series text not null default 'FR',
  year integer not null,
  number integer not null check (number > 0),
  customer_name text,
  customer_nuit text check (customer_nuit is null or customer_nuit ~ '^[0-9]{9}$'),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  issued_by uuid not null references public.users (id),
  issued_at timestamptz not null default now(),
  unique (business_id, series, year, number)
);

create index if not exists idx_invoices_business_issued
  on public.invoices (business_id, issued_at desc);

alter table public.invoices enable row level security;

drop policy if exists "invoices_select_members" on public.invoices;
create policy "invoices_select_members" on public.invoices
  for select using (public.is_member_of_business(business_id));

-- Sem políticas de insert/update/delete: só a função abaixo emite faturas.


-- ------------------------------------------------------------
-- 3. Emitir fatura de uma venda
-- ------------------------------------------------------------

create or replace function public.issue_invoice(
  p_sale_id uuid,
  p_customer_nuit text default null
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_invoice public.invoices;
  v_limit integer;
  v_used integer;
  v_year integer;
  v_number integer;
  v_customer_name text;
  v_nuit text := nullif(regexp_replace(coalesce(p_customer_nuit, ''), '\s', '', 'g'), '');
  v_month_start timestamptz;
begin
  select * into v_sale from public.sales where id = p_sale_id;
  if v_sale.id is null or public.current_user_role(v_sale.business_id) is null then
    raise exception 'Venda não encontrada';
  end if;

  -- Já emitida? Devolve a mesma (nunca duplica números).
  select * into v_invoice from public.invoices where sale_id = p_sale_id;
  if v_invoice.id is not null then
    return v_invoice;
  end if;

  perform public.require_active_subscription(v_sale.business_id);

  if v_nuit is not null and v_nuit !~ '^[0-9]{9}$' then
    raise exception 'O NUIT do cliente tem de ter 9 algarismos';
  end if;

  -- Um número de cada vez por negócio (evita números repetidos).
  perform pg_advisory_xact_lock(hashtext('invoice:' || v_sale.business_id::text));

  -- Limite mensal do plano (-1 ou sem valor = ilimitado).
  select nullif(p.limits ->> 'invoices_per_month', '')::integer
    into v_limit
  from public.plans p
  where p.slug = public.effective_plan_slug(v_sale.business_id);

  if v_limit is not null and v_limit >= 0 then
    v_month_start := date_trunc('month', now() at time zone 'Africa/Maputo') at time zone 'Africa/Maputo';
    select count(*) into v_used
    from public.invoices
    where business_id = v_sale.business_id
      and issued_at >= v_month_start;

    if v_used >= v_limit then
      raise exception 'Chegou ao limite de % faturas por mês do seu plano', v_limit;
    end if;
  end if;

  v_year := extract(year from (now() at time zone 'Africa/Maputo'))::integer;

  select coalesce(max(number), 0) + 1 into v_number
  from public.invoices
  where business_id = v_sale.business_id and series = 'FR' and year = v_year;

  if v_sale.customer_id is not null then
    select name into v_customer_name from public.customers where id = v_sale.customer_id;
  end if;

  insert into public.invoices (
    business_id, sale_id, series, year, number,
    customer_name, customer_nuit, total_amount, issued_by
  )
  values (
    v_sale.business_id, v_sale.id, 'FR', v_year, v_number,
    v_customer_name, v_nuit, v_sale.total_amount, auth.uid()
  )
  returning * into v_invoice;

  return v_invoice;
end;
$$;

revoke all on function public.issue_invoice(uuid, text) from public, anon;
grant execute on function public.issue_invoice(uuid, text) to authenticated;
