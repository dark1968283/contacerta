-- ============================================================
-- ContaCerta — Funcionários e convites por email
-- Migração 0013
-- NOTA: preparar e rever antes de aplicar no Supabase remoto.
-- ============================================================

BEGIN;

-- Convites privados para funcionários.
CREATE TABLE public.employee_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_invites_email_normalized
    CHECK (email = lower(trim(email)))
);

-- Impede convites pendentes duplicados para o mesmo negócio e email.
CREATE UNIQUE INDEX employee_invites_one_pending_per_email
  ON public.employee_invites (business_id, email)
  WHERE status = 'pending';

CREATE INDEX employee_invites_business_status_idx
  ON public.employee_invites (business_id, status, created_at DESC);

-- A tabela não é acessível diretamente pelos utilizadores normais.
ALTER TABLE public.employee_invites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.employee_invites
  FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.employee_invites TO service_role;


-- O onboarding e a aceitação do convite usam o mesmo bloqueio por utilizador.
-- A verificação e a associação ficam protegidas contra operações simultâneas.
CREATE OR REPLACE FUNCTION public.create_business_with_admin(p_name text)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_business public.businesses;
  v_user_id uuid := auth.uid();
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
    RAISE EXCEPTION 'Este utilizador já está associado a um negócio';
  END IF;

  INSERT INTO public.businesses (name, owner_id)
  VALUES (trim(p_name), v_user_id)
  RETURNING * INTO v_business;

  INSERT INTO public.business_users (business_id, user_id, role)
  VALUES (v_business.id, v_user_id, 'admin');

  RETURN v_business;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_business_with_admin(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_with_admin(text)
  TO authenticated;

-- Aceita o convite correspondente ao email da sessão autenticada.
-- O utilizador não pode escolher o negócio nem o email por parâmetros.
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

  -- Serializa aceitações simultâneas para a mesma conta.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_user_id::text)::bigint
  );

  -- Um utilizador só pode pertencer a um negócio no MVP.
  IF EXISTS (
    SELECT 1
      FROM public.business_users AS bu
     WHERE bu.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'user_already_has_business';
  END IF;

  SELECT count(*)
    INTO v_invite_count
    FROM public.employee_invites AS ei
   WHERE ei.email = v_email
     AND ei.status = 'pending'
     AND ei.expires_at > now();

  IF v_invite_count = 0 THEN
    RAISE EXCEPTION 'valid_invite_not_found';
  END IF;

  -- Não escolhe arbitrariamente entre convites de negócios diferentes.
  IF v_invite_count > 1 THEN
    RAISE EXCEPTION 'multiple_pending_invites';
  END IF;

  SELECT ei.*
    INTO v_invite
    FROM public.employee_invites AS ei
   WHERE ei.email = v_email
     AND ei.status = 'pending'
     AND ei.expires_at > now()
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'valid_invite_not_found';
  END IF;

  -- Segunda verificação após bloquear o convite.
  IF EXISTS (
    SELECT 1
      FROM public.business_users AS bu
     WHERE bu.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'user_already_has_business';
  END IF;

  INSERT INTO public.business_users (
    business_id,
    user_id,
    role
  )
  VALUES (
    v_invite.business_id,
    v_user_id,
    'funcionario'
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
