-- Fase 9: completa a operação comercial sem alterar a base da Fase 8.
create or replace function public.create_subscription_payment(
  p_plan_id uuid, p_billing_cycle text, p_payment_method text,
  p_transaction_id text default null, p_notes text default null
) returns public.subscription_payments language plpgsql security definer set search_path=public as $$
declare v_business uuid; v_plan public.plans; v_sub public.subscriptions; v_payment public.subscription_payments; v_amount numeric; v_reference text;
begin
  select business_id into v_business from public.business_users where user_id=auth.uid() limit 1;
  if v_business is null then raise exception 'Negócio não encontrado'; end if;
  select * into v_plan from public.plans where id=p_plan_id and active;
  if v_plan.id is null then raise exception 'Plano indisponível'; end if;
  if p_billing_cycle not in ('monthly','yearly') or p_payment_method not in ('mpesa','emola','mkesh','bank_transfer','cash','other') then raise exception 'Pedido de pagamento inválido'; end if;
  v_amount:=case when p_billing_cycle='monthly' then v_plan.monthly_price else v_plan.yearly_price end;
  select * into v_sub from public.subscriptions where business_id=v_business and status in ('pending','active','past_due','suspended') order by created_at desc limit 1 for update;
  if v_sub.id is null then insert into public.subscriptions(business_id,plan_id,billing_cycle,status,auto_renew) values(v_business,v_plan.id,p_billing_cycle,'pending',false) returning * into v_sub; insert into public.subscription_audit_logs(business_id,actor_id,action,details) values(v_business,auth.uid(),'subscription_created',jsonb_build_object('subscription_id',v_sub.id));
  else update public.subscriptions set plan_id=v_plan.id,billing_cycle=p_billing_cycle,status='pending',auto_renew=false where id=v_sub.id returning * into v_sub; end if;
  v_reference:='CC-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.subscription_payments(business_id,subscription_id,plan_id,amount,currency,billing_cycle,payment_method,reference,transaction_id,notes,paid_at) values(v_business,v_sub.id,v_plan.id,v_amount,v_plan.currency,p_billing_cycle,p_payment_method,v_reference,nullif(trim(p_transaction_id),''),p_notes,now()) returning * into v_payment;
  insert into public.subscription_audit_logs(business_id,actor_id,action,details) values(v_business,auth.uid(),'payment_created',jsonb_build_object('payment_id',v_payment.id,'reference',v_reference)); return v_payment;
end $$;
create or replace function public.confirm_subscription_payment(p_payment_id uuid,p_confirm boolean,p_notes text default null) returns public.subscription_payments language plpgsql security definer set search_path=public as $$
declare v_payment public.subscription_payments; v_sub public.subscriptions; v_start timestamptz;
begin if not public.is_platform_admin() then raise exception 'Sem permissão de plataforma'; end if; select * into v_payment from public.subscription_payments where id=p_payment_id for update; if v_payment.id is null or v_payment.status<>'pending' then raise exception 'Pagamento não está pendente'; end if;
if not p_confirm then update public.subscription_payments set status='rejected',notes=coalesce(p_notes,notes),confirmed_at=now(),confirmed_by=auth.uid() where id=v_payment.id returning * into v_payment; insert into public.subscription_audit_logs(business_id,actor_id,action,details) values(v_payment.business_id,auth.uid(),'payment_rejected',jsonb_build_object('payment_id',v_payment.id)); return v_payment; end if;
select * into v_sub from public.subscriptions where id=v_payment.subscription_id for update; v_start:=case when v_sub.status='active' and v_sub.current_period_end>now() then v_sub.current_period_end else now() end;
update public.subscriptions set plan_id=v_payment.plan_id,billing_cycle=v_payment.billing_cycle,status='active',start_date=coalesce(start_date,now()),current_period_start=v_start,current_period_end=case when v_payment.billing_cycle='monthly' then v_start+interval '1 month' else v_start+interval '1 year' end,cancelled_at=null,auto_renew=false where id=v_sub.id;
update public.subscription_payments set status='confirmed',paid_at=coalesce(paid_at,now()),notes=coalesce(p_notes,notes),confirmed_at=now(),confirmed_by=auth.uid() where id=v_payment.id returning * into v_payment;
insert into public.subscription_audit_logs(business_id,actor_id,action,details) values(v_payment.business_id,auth.uid(),'payment_confirmed',jsonb_build_object('payment_id',v_payment.id)); return v_payment; end $$;
create or replace function public.expire_due_subscriptions() returns integer language plpgsql security definer set search_path=public as $$ declare v_count integer; begin if not public.is_platform_admin() then raise exception 'Sem permissão de plataforma'; end if; with expired as (update public.subscriptions set status='expired' where status='active' and current_period_end<now() returning business_id,id) insert into public.subscription_audit_logs(business_id,actor_id,action,details) select business_id,auth.uid(),'subscription_expired',jsonb_build_object('subscription_id',id) from expired; get diagnostics v_count=row_count; return v_count; end $$;
