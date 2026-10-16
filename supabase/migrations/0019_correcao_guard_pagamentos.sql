BEGIN;

CREATE OR REPLACE FUNCTION public.create_subscription_payment(
  p_plan_id uuid,
  p_billing_cycle text,
  p_payment_method text,
  p_transaction_id text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.subscription_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_business uuid;
  v_plan public.plans;
  v_sub public.subscriptions;
  v_payment public.subscription_payments;
  v_amount numeric;
  v_reference text;
BEGIN
  SELECT business_id
    INTO v_business
    FROM public.business_users
   WHERE user_id = auth.uid()
   LIMIT 1;

  IF v_business IS NULL THEN
    RAISE EXCEPTION 'Negócio não encontrado';
  END IF;

  -- Apenas o administrador pode iniciar pedidos de pagamento.
  IF public.current_user_role(v_business) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  -- Serializa pedidos concorrentes do mesmo negócio.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_business::text)::bigint
  );

  -- Impede a criação de outro pedido enquanto houver um pendente.
  IF EXISTS (
    SELECT 1
      FROM public.subscription_payments
     WHERE business_id = v_business
       AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'payment_already_pending';
  END IF;

  SELECT *
    INTO v_plan
    FROM public.plans
   WHERE id = p_plan_id
     AND active;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plano indisponível';
  END IF;

  IF v_plan.slug NOT IN ('profissional', 'empresarial') THEN
    RAISE EXCEPTION 'plan_not_available_for_purchase';
  END IF;

  IF p_billing_cycle NOT IN ('monthly', 'yearly')
     OR p_payment_method NOT IN (
       'mpesa', 'emola', 'mkesh',
       'bank_transfer', 'cash', 'other'
     )
  THEN
    RAISE EXCEPTION 'Pedido de pagamento inválido';
  END IF;

  v_amount := CASE
    WHEN p_billing_cycle = 'monthly' THEN v_plan.monthly_price
    ELSE v_plan.yearly_price
  END;

  SELECT *
    INTO v_sub
    FROM public.subscriptions
   WHERE business_id = v_business
     AND status IN ('active', 'pending', 'past_due', 'suspended')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_sub.id IS NULL THEN
    INSERT INTO public.subscriptions (
      business_id, plan_id, billing_cycle, status, auto_renew
    )
    VALUES (
      v_business, v_plan.id, p_billing_cycle, 'pending', false
    )
    RETURNING * INTO v_sub;

    INSERT INTO public.subscription_audit_logs (
      business_id, actor_id, action, details
    )
    VALUES (
      v_business, auth.uid(), 'subscription_created',
      jsonb_build_object('subscription_id', v_sub.id)
    );

  ELSIF v_sub.status = 'pending' THEN
    UPDATE public.subscriptions
       SET plan_id = v_plan.id,
           billing_cycle = p_billing_cycle,
           auto_renew = false
     WHERE id = v_sub.id
    RETURNING * INTO v_sub;
  END IF;

  v_reference :=
    'CC-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.subscription_payments (
    business_id, subscription_id, plan_id, amount, currency,
    billing_cycle, payment_method, reference, transaction_id,
    notes, paid_at, confirmed_at, confirmed_by
  )
  VALUES (
    v_business, v_sub.id, v_plan.id, v_amount, v_plan.currency,
    p_billing_cycle, p_payment_method, v_reference,
    nullif(trim(p_transaction_id), ''), p_notes,
    NULL, NULL, NULL
  )
  RETURNING * INTO v_payment;

  INSERT INTO public.subscription_audit_logs (
    business_id, actor_id, action, details
  )
  VALUES (
    v_business, auth.uid(), 'payment_created',
    jsonb_build_object(
      'payment_id', v_payment.id,
      'reference', v_reference
    )
  );

  RETURN v_payment;

EXCEPTION
  WHEN unique_violation THEN
    IF SQLERRM LIKE '%transaction_id%' THEN
      RAISE EXCEPTION 'Esta transação já foi utilizada';
    END IF;
    RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_subscription_payment(
  p_payment_id uuid,
  p_confirm boolean,
  p_notes text DEFAULT NULL
)
RETURNS public.subscription_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_payment public.subscription_payments;
  v_sub public.subscriptions;
  v_start timestamptz;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Sem permissão de plataforma';
  END IF;

  -- Lê o negócio sem bloquear a linha do pagamento.
  SELECT *
    INTO v_payment
    FROM public.subscription_payments
   WHERE id = p_payment_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Pagamento não está pendente';
  END IF;

  -- Adquire primeiro o mesmo bloqueio usado na criação de pagamentos.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_payment.business_id::text)::bigint
  );

  -- Só depois bloqueia a linha e valida novamente o estado.
  SELECT *
    INTO v_payment
    FROM public.subscription_payments
   WHERE id = p_payment_id
   FOR UPDATE;

  IF v_payment.id IS NULL OR v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Pagamento não está pendente';
  END IF;

  IF NOT p_confirm THEN
    UPDATE public.subscription_payments
       SET status = 'rejected',
           notes = coalesce(p_notes, notes),
           confirmed_at = now(),
           confirmed_by = auth.uid()
     WHERE id = v_payment.id
    RETURNING * INTO v_payment;

    INSERT INTO public.subscription_audit_logs (
      business_id, actor_id, action, details
    )
    VALUES (
      v_payment.business_id, auth.uid(), 'payment_rejected',
      jsonb_build_object('payment_id', v_payment.id)
    );

    RETURN v_payment;
  END IF;

  -- Se existir um pedido posterior ainda pendente ou já confirmado,
  -- este pedido antigo não pode activar ou substituir o plano.
  IF EXISTS (
    SELECT 1
      FROM public.subscription_payments AS newer
     WHERE newer.subscription_id = v_payment.subscription_id
       AND (newer.created_at, newer.id) >
           (v_payment.created_at, v_payment.id)
       AND newer.status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'payment_superseded';
  END IF;

  SELECT *
    INTO v_sub
    FROM public.subscriptions
   WHERE id = v_payment.subscription_id
   FOR UPDATE;

  IF v_sub.id IS NULL
     OR v_sub.business_id IS DISTINCT FROM v_payment.business_id THEN
    RAISE EXCEPTION 'subscription_payment_mismatch';
  END IF;

  -- Se o período actual ainda estiver válido, a renovação começa
  -- no seu fim; caso contrário, começa agora.
  v_start := CASE
    WHEN v_sub.status = 'active'
     AND v_sub.current_period_end > now()
    THEN v_sub.current_period_end
    ELSE now()
  END;

  UPDATE public.subscriptions
     SET plan_id = v_payment.plan_id,
         billing_cycle = v_payment.billing_cycle,
         status = 'active',
         start_date = coalesce(start_date, now()),
         current_period_start = v_start,
         current_period_end = CASE
           WHEN v_payment.billing_cycle = 'monthly'
             THEN v_start + interval '1 month'
           ELSE v_start + interval '1 year'
         END,
         cancelled_at = NULL,
         auto_renew = false
   WHERE id = v_sub.id;

  UPDATE public.subscription_payments
     SET status = 'confirmed',
         paid_at = coalesce(paid_at, now()),
         notes = coalesce(p_notes, notes),
         confirmed_at = now(),
         confirmed_by = auth.uid()
   WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  INSERT INTO public.subscription_audit_logs (
    business_id, actor_id, action, details
  )
  VALUES (
    v_payment.business_id, auth.uid(), 'payment_confirmed',
    jsonb_build_object('payment_id', v_payment.id)
  );

  RETURN v_payment;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_subscription_payment(
  uuid, text, text, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_subscription_payment(
  uuid, text, text, text, text
) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.confirm_subscription_payment(
  uuid, boolean, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.confirm_subscription_payment(
  uuid, boolean, text
) TO authenticated;

COMMIT;
