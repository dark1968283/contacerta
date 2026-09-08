-- ============================================================
-- ContaCerta — Fase 3: Clientes
-- Tabela: customers
-- Permissão (PRD v1.2, secção 8): Admin adiciona e edita;
-- Funcionário só adiciona (não edita).
-- ============================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create index if not exists idx_customers_business_name on public.customers (business_id, name);
create index if not exists idx_customers_business_phone on public.customers (business_id, phone);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.customers enable row level security;

-- Qualquer membro do negócio vê os clientes.
create policy "customers_select_members" on public.customers
  for select using (public.is_member_of_business(business_id));

-- Qualquer membro (admin OU funcionário) pode adicionar um cliente novo.
create policy "customers_insert_members" on public.customers
  for insert with check (public.is_member_of_business(business_id));

-- Só admin pode editar um cliente já existente.
create policy "customers_update_admin" on public.customers
  for update using (public.current_user_role(business_id) = 'admin')
  with check (public.current_user_role(business_id) = 'admin');

-- Não há policy de DELETE de propósito — o MVP não tem remoção de clientes
-- (evita órfãos em dívidas/vendas quando essas tabelas existirem).
