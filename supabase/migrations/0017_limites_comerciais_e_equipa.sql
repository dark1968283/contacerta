-- ContaCerta: limites comerciais e protecção da equipa.
-- Preparação local: NÃO aplicar à produção sem revisão.
-- Não elimina planos, subscrições, vendas ou dados existentes.

BEGIN;

-- 1. O plano efectivo é uma função interna das RPCs.
-- Impedir que utilizadores consultem directamente o plano de outros negócios.
REVOKE ALL ON FUNCTION public.effective_plan_slug(uuid)
  FROM PUBLIC, anon, authenticated;

-- 2. Actualizar apenas os limites dos planos existentes.
-- Preservar as restantes chaves JSON, funcionalidades e preços.
UPDATE public.plans
SET limits = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(limits, '{}'::jsonb),
      '{users}', '1'::jsonb, true
    ),
    '{products}', '5'::jsonb, true
  ),
  '{sales_per_month}', '30'::jsonb, true
)
WHERE slug = 'gratis';

-- 5 funcionários + administrador = 6 utilizadores.
UPDATE public.plans
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{users}', '6'::jsonb, true
)
WHERE slug = 'profissional';

-- 15 funcionários + administrador = 16 utilizadores.
UPDATE public.plans
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{users}', '16'::jsonb, true
)
WHERE slug = 'empresarial';

-- 3. Limitar a aceitação dos convites na própria base de dados.
-- As aceitações do mesmo negócio são serializadas para evitar excesso
-- de membros quando vários convites são aceites ao mesmo tempo.
CREATE OR REPLACE FUNCTION public.accept_pending_employee_invite()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.employee_invites%ROWTYPE;
  v_invite_count integer;
  v_plan_slug text;
  v_user_limit integer;
  v_user_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  SELECT lower(trim(u.email))
    INTO v_email
    FROM auth.users AS u
   WHERE u.id = v_user_id;

  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email_required';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_user_id::text)::bigint
  );

  IF EXISTS (
    SELECT 1
    FROM public.business_users AS bu
    WHERE bu.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'user_already_has_business';
  END IF;

  SELECT count(*)::integer
    INTO v_invite_count
    FROM public.employee_invites AS ei
   WHERE ei.email = v_email
     AND ei.status = 'pending'
     AND ei.expires_at > pg_catalog.now();

  IF v_invite_count = 0 THEN
    RAISE EXCEPTION 'valid_invite_not_found';
  END IF;

  IF v_invite_count > 1 THEN
    RAISE EXCEPTION 'multiple_pending_invites';
  END IF;

  SELECT ei.*
    INTO v_invite
    FROM public.employee_invites AS ei
   WHERE ei.email = v_email
     AND ei.status = 'pending'
     AND ei.expires_at > pg_catalog.now()
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'valid_invite_not_found';
  END IF;

  -- Serializar alterações à equipa do negócio.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_invite.business_id::text)::bigint
  );

  IF EXISTS (
    SELECT 1
    FROM public.business_users AS bu
    WHERE bu.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'user_already_has_business';
  END IF;

  v_plan_slug := public.effective_plan_slug(v_invite.business_id);

  SELECT COALESCE((p.limits ->> 'users')::integer, 1)
    INTO v_user_limit
    FROM public.plans AS p
   WHERE p.slug = v_plan_slug
   LIMIT 1;

  IF v_plan_slug IS NULL THEN
    RAISE EXCEPTION 'subscription_required';
  END IF;

  -- O teste gratuito tem acesso completo, incluindo a equipa.
  IF v_plan_slug = 'trial-18-dias' THEN
    v_user_limit := 16;
  END IF;

  SELECT count(*)::integer
    INTO v_user_count
    FROM public.business_users AS bu
   WHERE bu.business_id = v_invite.business_id;

  IF v_user_count >= v_user_limit THEN
    RAISE EXCEPTION 'team_limit_reached';
  END IF;

  INSERT INTO public.business_users (
    business_id, user_id, role
  )
  VALUES (
    v_invite.business_id, v_user_id, 'funcionario'
  );

  UPDATE public.employee_invites
     SET status = 'accepted',
         accepted_user_id = v_user_id
   WHERE id = v_invite.id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite_already_processed';
  END IF;

  RETURN v_invite.business_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_pending_employee_invite()
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_pending_employee_invite()
  TO authenticated;

COMMIT;
