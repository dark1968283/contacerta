-- ============================================================
-- ContaCerta — Pagamento automático das assinaturas (PaySuite)
-- Migration: 0023_paysuite.sql
--
-- 1. Guarda no pedido de pagamento o id e o link de pagamento da PaySuite.
-- 2. Deixa o servidor (service role, usado só pelo webhook da PaySuite)
--    confirmar pagamentos com a MESMA regra que o administrador da
--    plataforma usa à mão. Nada muda para quem confirma manualmente.
-- ============================================================

begin;

alter table public.subscription_payments add column if not exists provider text;
alter table public.subscription_payments add column if not exists provider_payment_id text;
alter table public.subscription_payments add column if not exists provider_checkout_url text;

create unique index if not exists subscription_payments_provider_payment_id_key
  on public.subscription_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create or replace function public.confirm_subscription_payment(
  p_payment_id uuid,
  p_confirm boolean,
  p_notes text default null
)
returns public.subscription_payments
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_payment public.subscription_payments;
  v_sub public.subscriptions;
  v_start timestamptz;
begin
  -- Administrador da plataforma (à mão) ou o servidor (webhook PaySuite).
  if not (public.is_platform_admin() or coalesce(auth.role(), '') = 'service_role') then
    raise exception 'Sem permissão de plataforma';
  end if;

  select * into v_payment from public.subscription_payments where id = p_payment_id;
  if v_payment.id is null then
    raise exception 'Pagamento não está pendente';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_payment.business_id::text)::bigint);

  select * into v_payment from public.subscription_payments where id = p_payment_id for update;
  if v_payment.id is null or v_payment.status <> 'pending' then
    raise exception 'Pagamento não está pendente';
  end if;

  if not p_confirm then
    update public.subscription_payments
       set status = 'rejected',
           notes = coalesce(p_notes, notes),
           confirmed_at = now(),
           confirmed_by = auth.uid()
     where id = v_payment.id
    returning * into v_payment;

    insert into public.subscription_audit_logs (business_id, actor_id, action, details)
    values (v_payment.business_id, auth.uid(), 'payment_rejected', jsonb_build_object('payment_id', v_payment.id));

    return v_payment;
  end if;

  if exists (
    select 1
      from public.subscription_payments as newer
     where newer.subscription_id = v_payment.subscription_id
       and (newer.created_at, newer.id) > (v_payment.created_at, v_payment.id)
       and newer.status in ('pending', 'confirmed')
  ) then
    raise exception 'payment_superseded';
  end if;

  select * into v_sub from public.subscriptions where id = v_payment.subscription_id for update;
  if v_sub.id is null or v_sub.business_id is distinct from v_payment.business_id then
    raise exception 'subscription_payment_mismatch';
  end if;

  v_start := case
    when v_sub.status = 'active' and v_sub.current_period_end > now() then v_sub.current_period_end
    else now()
  end;

  update public.subscriptions
     set plan_id = v_payment.plan_id,
         billing_cycle = v_payment.billing_cycle,
         status = 'active',
         start_date = coalesce(start_date, now()),
         current_period_start = v_start,
         current_period_end = case
           when v_payment.billing_cycle = 'monthly' then v_start + interval '1 month'
           else v_start + interval '1 year'
         end,
         cancelled_at = null,
         auto_renew = false
   where id = v_sub.id;

  update public.subscription_payments
     set status = 'confirmed',
         paid_at = coalesce(paid_at, now()),
         notes = coalesce(p_notes, notes),
         confirmed_at = now(),
         confirmed_by = auth.uid()
   where id = v_payment.id
  returning * into v_payment;

  insert into public.subscription_audit_logs (business_id, actor_id, action, details)
  values (
    v_payment.business_id,
    auth.uid(),
    'payment_confirmed',
    jsonb_build_object('payment_id', v_payment.id, 'provider', v_payment.provider)
  );

  return v_payment;
end;
$function$;

revoke execute on function public.confirm_subscription_payment(uuid, boolean, text) from public, anon;
grant execute on function public.confirm_subscription_payment(uuid, boolean, text) to authenticated, service_role;

commit;
