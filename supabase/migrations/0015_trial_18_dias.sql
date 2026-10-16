-- ContaCerta: teste gratuito de 18 dias para novos negócios.
-- Não altera as assinaturas dos negócios já existentes.

BEGIN;

-- 1. Plano técnico do período experimental.
-- Fica inactivo para não aparecer no checkout comercial normal.
INSERT INTO public.plans (
  name,
  slug,
  description,
  monthly_price,
  yearly_price,
  currency,
  active,
  display_order,
  limits,
  features,
  grace_period_days
)
VALUES (
  'Teste gratuito (18 dias)',
  'trial-18-dias',
  'Acesso experimental ao ContaCerta durante 18 dias.',
  0,
  0,
  'MZN',
  false,
  0,
  '{}'::jsonb,
  '[
    "Registo de produtos e stock",
    "Registo de vendas",
    "Gestão de clientes e dívidas",
    "Acesso temporário às funcionalidades disponíveis"
  ]'::jsonb,
  0
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = 0,
  yearly_price = 0,
  currency = 'MZN',
  active = false,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  grace_period_days = 0;

-- 2. Permitir a leitura dos metadados do plano experimental por utilizadores autenticados.
-- O plano continua fora da lista comercial porque active = false.
DROP POLICY IF EXISTS "trial_plan_subscriber_read"
  ON public.plans;

-- O plano experimental contém apenas metadados comerciais.
-- Pode ser consultado por utilizadores autenticados, mas continua
-- inactivo e não aparece na lista normal de planos pagos.
CREATE POLICY "trial_plan_subscriber_read"
  ON public.plans
  FOR SELECT
  USING (
    slug = 'trial-18-dias'
    AND auth.uid() IS NOT NULL
  );

-- 3. Criar negócio, associar administrador e activar o teste
-- na mesma transacção.
CREATE OR REPLACE FUNCTION public.create_business_with_admin(
  p_name text
)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_business public.businesses;
  v_user_id uuid := auth.uid();
  v_trial_plan_id uuid;
  v_now timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'O nome do negócio é obrigatório';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_user_id::text)::bigint
  );

  IF EXISTS (
    SELECT 1
    FROM public.business_users
    WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION
      'Este utilizador já está associado a um negócio';
  END IF;

  SELECT id
    INTO v_trial_plan_id
    FROM public.plans
   WHERE slug = 'trial-18-dias'
   LIMIT 1;

  IF v_trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'trial_plan_not_configured';
  END IF;

  INSERT INTO public.businesses (name, owner_id)
  VALUES (trim(p_name), v_user_id)
  RETURNING * INTO v_business;

  INSERT INTO public.business_users (
    business_id,
    user_id,
    role
  )
  VALUES (
    v_business.id,
    v_user_id,
    'admin'
  );

  INSERT INTO public.subscriptions (
    business_id,
    plan_id,
    billing_cycle,
    status,
    start_date,
    current_period_start,
    current_period_end,
    auto_renew
  )
  VALUES (
    v_business.id,
    v_trial_plan_id,
    'monthly',
    'active',
    v_now,
    v_now,
    v_now + interval '18 days',
    false
  );

  RETURN v_business;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.create_business_with_admin(text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
  public.create_business_with_admin(text)
  TO authenticated;

COMMIT;
