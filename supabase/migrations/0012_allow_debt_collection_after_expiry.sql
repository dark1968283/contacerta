BEGIN;

-- ContaCerta: permitir cobrar dívidas existentes após expiração.
-- Mantém autenticação, autorização, bloqueio concorrente e validações.
-- Não remove os gates das vendas, produtos ou ajustes de stock.

CREATE OR REPLACE FUNCTION public.register_debt_payment(
  p_debt_id uuid,
  p_amount numeric,
  p_payment_method text
)
RETURNS public.debts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_debt public.debts;
  v_remaining numeric(12, 2);
  v_new_amount_paid numeric(12, 2);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'O pagamento deve ser maior que zero';
  END IF;

  IF p_payment_method IS NULL
     OR p_payment_method NOT IN (
       'dinheiro', 'mpesa', 'emola', 'transferencia', 'outro'
     ) THEN
    RAISE EXCEPTION 'Método de pagamento inválido';
  END IF;

  -- Serializa pagamentos concorrentes sobre a mesma dívida.
  SELECT *
  INTO v_debt
  FROM public.debts
  WHERE id = p_debt_id
  FOR UPDATE;

  IF v_debt.id IS NULL THEN
    RAISE EXCEPTION 'Dívida não encontrada';
  END IF;

  -- Continua a exigir que o utilizador pertença ao negócio.
  IF public.current_user_role(v_debt.business_id) IS NULL THEN
    RAISE EXCEPTION
      'Sem permissão para registar pagamento nesta dívida'
      USING ERRCODE = '42501';
  END IF;

  -- Intencionalmente não chama require_active_subscription:
  -- trata-se da cobrança de uma dívida já existente.

  IF v_debt.status = 'paga' THEN
    RAISE EXCEPTION 'Esta dívida já foi paga';
  END IF;

  v_remaining := v_debt.total_amount - v_debt.amount_paid;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION
      'O pagamento não pode ser superior ao saldo em aberto';
  END IF;

  v_new_amount_paid := v_debt.amount_paid + p_amount;

  INSERT INTO public.debt_payments (
    business_id,
    debt_id,
    amount,
    payment_method,
    created_by
  )
  VALUES (
    v_debt.business_id,
    v_debt.id,
    p_amount,
    p_payment_method,
    auth.uid()
  );

  UPDATE public.debts
  SET
    amount_paid = v_new_amount_paid,
    status = CASE
      WHEN v_new_amount_paid = 0 THEN 'pendente'
      WHEN v_new_amount_paid < v_debt.total_amount THEN 'parcial'
      ELSE 'paga'
    END
  WHERE id = v_debt.id
  RETURNING * INTO v_debt;

  RETURN v_debt;
END;
$function$;

COMMENT ON FUNCTION public.register_debt_payment(uuid, numeric, text) IS
  'Regista pagamentos de dívidas existentes, mesmo após expiração da subscrição. Mantém autorização por negócio, validação de saldo e actualização atómica.';

-- Reforçar os privilégios previstos no hardening existente.
REVOKE EXECUTE ON FUNCTION
  public.register_debt_payment(uuid, numeric, text)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.register_debt_payment(uuid, numeric, text)
TO authenticated;

COMMIT;
