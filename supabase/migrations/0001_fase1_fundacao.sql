-- ============================================================
-- ContaCerta — Fase 1: Fundação
-- Tabelas: users, businesses, business_users
-- RLS multi-tenant + trigger de perfil + RPC de onboarding
-- ============================================================

-- ------------------------------------------------------------
-- 1. users — espelha auth.users com dados de perfil
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  email text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Perfil de utilizador, 1:1 com auth.users.';

-- Trigger: sempre que um novo utilizador se regista no Supabase Auth,
-- cria automaticamente a linha correspondente em public.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. businesses
-- ------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'MZN',
  owner_id uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

comment on table public.businesses is 'Cada negócio é o "tenant" — todos os dados operacionais pendem de business_id.';

-- ------------------------------------------------------------
-- 3. business_users — papel do utilizador dentro de um negócio
-- ------------------------------------------------------------
create table if not exists public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('admin', 'funcionario')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

comment on table public.business_users is 'Associação utilizador↔negócio com papel (admin|funcionario). MVP: 1 negócio por utilizador, mas a tabela já suporta multi-negócio futuro.';

create index if not exists idx_business_users_user on public.business_users (user_id);
create index if not exists idx_business_users_business on public.business_users (business_id);

-- ------------------------------------------------------------
-- 4. Função auxiliar: papel do utilizador autenticado num negócio
--    (usada pelas policies de RLS de TODAS as tabelas futuras)
-- ------------------------------------------------------------
create or replace function public.current_user_role(p_business_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.business_users
  where business_id = p_business_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_member_of_business(p_business_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.business_users
    where business_id = p_business_id and user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- 5. RPC de onboarding: cria negócio + associa admin, atomicamente
-- ------------------------------------------------------------
create or replace function public.create_business_with_admin(p_name text)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'O nome do negócio é obrigatório';
  end if;

  -- MVP: um utilizador só pode ter um negócio.
  if exists (select 1 from public.business_users where user_id = auth.uid()) then
    raise exception 'Este utilizador já está associado a um negócio';
  end if;

  insert into public.businesses (name, owner_id)
  values (trim(p_name), auth.uid())
  returning * into v_business;

  insert into public.business_users (business_id, user_id, role)
  values (v_business.id, auth.uid(), 'admin');

  return v_business;
end;
$$;

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_users enable row level security;

-- users: só pode ver/editar o próprio perfil
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid());

-- businesses: apenas membros do negócio
create policy "businesses_select_members" on public.businesses
  for select using (public.is_member_of_business(id));

create policy "businesses_update_admin" on public.businesses
  for update using (public.current_user_role(id) = 'admin');

-- business_users: apenas membros do mesmo negócio veem a lista de membros;
-- só admin pode gerir associações (convidar/remover funcionários — Fase 2+)
create policy "business_users_select_members" on public.business_users
  for select using (public.is_member_of_business(business_id));

create policy "business_users_admin_manage" on public.business_users
  for all using (public.current_user_role(business_id) = 'admin')
  with check (public.current_user_role(business_id) = 'admin');

-- Nota: o INSERT inicial (criação do 1º admin) acontece dentro de
-- create_business_with_admin, que corre como SECURITY DEFINER —
-- não depende da policy acima, que serve para gestão *depois* de existir.
