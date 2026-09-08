-- ContaCerta — Fase 8: camada comercial SaaS (separada do financeiro do negócio)
create table public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text, monthly_price numeric(12,2) not null default 0 check(monthly_price>=0), yearly_price numeric(12,2) not null default 0 check(yearly_price>=0),
  currency text not null default 'MZN', active boolean not null default true, display_order integer not null default 0,
  limits jsonb not null default '{}'::jsonb, features jsonb not null default '[]'::jsonb, grace_period_days integer not null default 0 check(grace_period_days>=0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.plans(id), billing_cycle text not null check(billing_cycle in ('monthly','yearly')),
  status text not null default 'pending' check(status in ('pending','active','past_due','expired','cancelled','suspended')),
  start_date timestamptz, current_period_start timestamptz, current_period_end timestamptz, auto_renew boolean not null default false,
  cancelled_at timestamptz, cancellation_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index subscriptions_one_current_per_business on public.subscriptions(business_id) where status in ('pending','active','past_due','suspended');
create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id), plan_id uuid not null references public.plans(id),
  amount numeric(12,2) not null check(amount>=0), currency text not null default 'MZN', billing_cycle text not null check(billing_cycle in ('monthly','yearly')),
  payment_method text not null check(payment_method in ('mpesa','emola','mkesh','bank_transfer','cash','other')),
  status text not null default 'pending' check(status in ('pending','confirmed','rejected','cancelled','refunded')),
  reference text not null unique, transaction_id text unique, notes text, paid_at timestamptz, confirmed_at timestamptz, confirmed_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.subscription_audit_logs (id uuid primary key default gen_random_uuid(), business_id uuid references public.businesses(id) on delete set null, actor_id uuid references auth.users(id), action text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create or replace function public.is_platform_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from public.platform_admins where auth_user_id=auth.uid() and active) $$;
create or replace function public.fase8_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger plans_updated before update on public.plans for each row execute function public.fase8_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function public.fase8_updated_at();
create trigger subscription_payments_updated before update on public.subscription_payments for each row execute function public.fase8_updated_at();
alter table public.platform_admins enable row level security; alter table public.plans enable row level security; alter table public.subscriptions enable row level security; alter table public.subscription_payments enable row level security; alter table public.subscription_audit_logs enable row level security;
create policy "platform_admins_platform_only" on public.platform_admins for select using(public.is_platform_admin());
create policy "plans_public_read" on public.plans for select using(active or public.is_platform_admin()); create policy "plans_platform_manage" on public.plans for all using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy "subscriptions_business_read" on public.subscriptions for select using(public.is_member_of_business(business_id) or public.is_platform_admin());
create policy "payments_business_read" on public.subscription_payments for select using(public.is_member_of_business(business_id) or public.is_platform_admin());
create policy "audit_platform_read" on public.subscription_audit_logs for select using(public.is_platform_admin());
create or replace function public.create_subscription_payment(p_plan_id uuid,p_billing_cycle text,p_payment_method text,p_reference text,p_notes text default null) returns public.subscription_payments language plpgsql security definer set search_path=public as $$ declare v_business uuid; v_plan public.plans; v_sub public.subscriptions; v_payment public.subscription_payments; v_amount numeric; begin select business_id into v_business from public.business_users where user_id=auth.uid() limit 1; if v_business is null then raise exception 'Negócio não encontrado'; end if; select * into v_plan from public.plans where id=p_plan_id and active; if v_plan.id is null then raise exception 'Plano indisponível'; end if; if p_billing_cycle not in ('monthly','yearly') or p_payment_method not in ('mpesa','emola','mkesh','bank_transfer','cash','other') or length(trim(coalesce(p_reference,'')))=0 then raise exception 'Pedido de pagamento inválido'; end if; v_amount:=case when p_billing_cycle='monthly' then v_plan.monthly_price else v_plan.yearly_price end; select * into v_sub from public.subscriptions where business_id=v_business and status in ('pending','active','past_due','suspended') order by created_at desc limit 1 for update; if v_sub.id is null then insert into public.subscriptions(business_id,plan_id,billing_cycle) values(v_business,v_plan.id,p_billing_cycle) returning * into v_sub; else update public.subscriptions set plan_id=v_plan.id,billing_cycle=p_billing_cycle,status='pending' where id=v_sub.id returning * into v_sub; end if; insert into public.subscription_payments(business_id,subscription_id,plan_id,amount,currency,billing_cycle,payment_method,reference,notes,paid_at) values(v_business,v_sub.id,v_plan.id,v_amount,v_plan.currency,p_billing_cycle,p_payment_method,trim(p_reference),p_notes,now()) returning * into v_payment; return v_payment; end $$;
create or replace function public.confirm_subscription_payment(p_payment_id uuid,p_confirm boolean,p_notes text default null) returns public.subscription_payments language plpgsql security definer set search_path=public as $$ declare v_payment public.subscription_payments; v_sub public.subscriptions; v_start timestamptz; begin if not public.is_platform_admin() then raise exception 'Sem permissão de plataforma'; end if; select * into v_payment from public.subscription_payments where id=p_payment_id for update; if v_payment.id is null or v_payment.status<>'pending' then raise exception 'Pagamento não está pendente'; end if; if not p_confirm then update public.subscription_payments set status='rejected',notes=coalesce(p_notes,notes),confirmed_at=now(),confirmed_by=auth.uid() where id=v_payment.id returning * into v_payment; return v_payment; end if; select * into v_sub from public.subscriptions where id=v_payment.subscription_id for update; v_start:=greatest(coalesce(v_sub.current_period_end,now()),now()); update public.subscriptions set plan_id=v_payment.plan_id,billing_cycle=v_payment.billing_cycle,status='active',start_date=coalesce(start_date,now()),current_period_start=v_start,current_period_end=case when v_payment.billing_cycle='monthly' then v_start+interval '1 month' else v_start+interval '1 year' end where id=v_sub.id; update public.subscription_payments set status='confirmed',notes=coalesce(p_notes,notes),confirmed_at=now(),confirmed_by=auth.uid() where id=v_payment.id returning * into v_payment; insert into public.subscription_audit_logs(business_id,actor_id,action,details) values(v_payment.business_id,auth.uid(),'payment_confirmed',jsonb_build_object('payment_id',v_payment.id)); return v_payment; end $$;
