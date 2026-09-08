BEGIN;

-- ============================================================
-- FASE 9.3 — HARDENING FINAL
-- Migration: 0011_fase9_3_hardening.sql
--
-- Objetivos:
-- 1. Remover EXECUTE público das funções sensíveis
-- 2. Permitir execução apenas a utilizadores autenticados
-- 3. Impedir mudança de business_id em business_users
-- 4. Garantir que produto e categoria pertencem ao mesmo negócio
-- ============================================================


-- ============================================================
-- 1. HARDENING DE EXECUTE DAS FUNCTIONS
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.adjust_stock(
  uuid, text, integer, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.adjust_stock(
  uuid, text, integer, text
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.confirm_subscription_payment(
  uuid, boolean, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.confirm_subscription_payment(
  uuid, boolean, text
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.create_business_with_admin(
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_business_with_admin(
  text
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.create_product(
  uuid, text, uuid, numeric, numeric, integer, integer
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_product(
  uuid, text, uuid, numeric, numeric, integer, integer
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.create_sale(
  uuid, text, uuid, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_sale(
  uuid, text, uuid, jsonb
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.create_subscription_payment(
  uuid, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_subscription_payment(
  uuid, text, text, text, text
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.current_user_role(
  uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_role(
  uuid
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.expire_due_subscriptions()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions()
TO authenticated;


REVOKE EXECUTE ON FUNCTION public.has_active_subscription(
  uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(
  uuid
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.is_member_of_business(
  uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_member_of_business(
  uuid
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.is_platform_admin()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_platform_admin()
TO authenticated;


REVOKE EXECUTE ON FUNCTION public.register_debt_payment(
  uuid, numeric, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.register_debt_payment(
  uuid, numeric, text
) TO authenticated;


REVOKE EXECUTE ON FUNCTION public.require_active_subscription(
  uuid
) FROM PUBLIC;


-- Trigger interno.
-- Não deve ser exposto como RPC público.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
FROM PUBLIC;


-- ============================================================
-- 2. IMPEDIR TRANSFERÊNCIA DE UTILIZADOR ENTRE NEGÓCIOS
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_business_users_business_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION
      'Não é permitido alterar o negócio associado a um utilizador.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE
ON FUNCTION public.prevent_business_users_business_change()
FROM PUBLIC;


DROP TRIGGER IF EXISTS trg_prevent_business_users_business_change
ON public.business_users;

CREATE TRIGGER trg_prevent_business_users_business_change
BEFORE UPDATE OF business_id
ON public.business_users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_business_users_business_change();


-- ============================================================
-- 3. GARANTIR QUE PRODUTO E CATEGORIA PERTENCEM AO MESMO
--    BUSINESS
-- ============================================================

ALTER TABLE public.categories
  ADD CONSTRAINT categories_id_business_id_key
  UNIQUE (id, business_id);


ALTER TABLE public.products
  ADD CONSTRAINT products_category_business_fkey
  FOREIGN KEY (category_id, business_id)
  REFERENCES public.categories (id, business_id);


COMMIT;