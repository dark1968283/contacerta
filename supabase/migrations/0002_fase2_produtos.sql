-- ============================================================
-- ContaCerta — Fase 2: Produtos, Stock e Alertas
-- Tabelas: categories, products, stock_movements
-- RPCs: create_product (atómica, com stock inicial auditável),
--       adjust_stock (entradas/ajustes, nunca deixa stock negativo)
-- ============================================================

-- ------------------------------------------------------------
-- 1. categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists idx_categories_business on public.categories (business_id);

-- ------------------------------------------------------------
-- 2. products
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  selling_price numeric(12, 2) not null check (selling_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.products.cost_price is
  'Nullable de propósito — RF-12. Produtos sem custo ficam fora do cálculo de lucro bruto (ver Dashboard, Fase 6), nunca tratados como custo zero.';
comment on column public.products.stock_quantity is
  'Nunca atualizar diretamente via UPDATE solto — só via create_product (stock inicial) ou adjust_stock (entradas/ajustes), para manter stock_movements como registo de auditoria fiel.';

create index if not exists idx_products_business_name on public.products (business_id, name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. stock_movements — auditoria de todas as alterações de stock
-- ------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null check (type in ('entrada', 'venda', 'ajuste')),
  quantity integer not null check (quantity <> 0),
  note text,
  reference_type text,
  reference_id uuid,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

comment on table public.stock_movements is
  'Registo append-only. "venda" é criado pela RPC create_sale (Fase 4) com quantidade negativa; "entrada"/"ajuste" são criados por adjust_stock (Fase 2).';

create index if not exists idx_stock_movements_business_product
  on public.stock_movements (business_id, product_id);

-- ------------------------------------------------------------
-- 4. RPC: create_product — insere produto + stock inicial auditável
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 5. RPC: adjust_stock — entradas e ajustes, nunca fica negativo
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

-- categories: qualquer membro vê; só admin gere (a criação normal passa
-- por aqui diretamente — é uma operação de tabela única, sem precisar de RPC)
create policy "categories_select_members" on public.categories
  for select using (public.is_member_of_business(business_id));

create policy "categories_admin_manage" on public.categories
  for all using (public.current_user_role(business_id) = 'admin')
  with check (public.current_user_role(business_id) = 'admin');

-- products: qualquer membro vê; só admin edita campos (nome, preços,
-- categoria, limite de stock baixo, ativo/inativo).
-- A CRIAÇÃO só acontece via create_product (SECURITY DEFINER) — não há
-- policy de INSERT aqui de propósito, força todos a passar pela RPC.
create policy "products_select_members" on public.products
  for select using (public.is_member_of_business(business_id));

create policy "products_admin_update" on public.products
  for update using (public.current_user_role(business_id) = 'admin')
  with check (public.current_user_role(business_id) = 'admin');

-- stock_movements: qualquer membro vê o histórico; NINGUÉM escreve
-- diretamente — só create_product e adjust_stock (SECURITY DEFINER)
-- podem inserir. Não há policy de INSERT de propósito.
create policy "stock_movements_select_members" on public.stock_movements
  for select using (public.is_member_of_business(business_id));
