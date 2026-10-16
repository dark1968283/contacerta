-- ContaCerta: transição do teste para Grátis e limites operacionais.
-- Preparação local: NÃO aplicar à produção sem revisão.
-- Preserva subscrições, vendas, produtos e dívidas existentes.

BEGIN;

-- 1. Determinar o plano efectivo sem alterar o histórico da subscrição.
-- O teste expirado passa a usar os limites do Grátis.
-- Subscrições pagas expiradas continuam sem acesso operacional.
CREATE OR REPLACE FUNCTION public.effective_plan_slug(
  p_business_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_slug text;
BEGIN
  -- 1. Uma subscrição paga válida tem prioridade.
  SELECT p.slug
    INTO v_slug
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.business_id = p_business_id
    AND p.slug NOT IN ('gratis', 'trial-18-dias')
    AND s.status = 'active'
    AND s.current_period_end > now()
  ORDER BY s.current_period_end DESC, s.created_at DESC
  LIMIT 1;

  IF v_slug IS NOT NULL THEN
    RETURN v_slug;
  END IF;

  -- 2. Histórico pago não pendente, mas sem subscrição válida:
  -- não conceder acesso Grátis automaticamente.
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
      AND p.slug NOT IN ('gratis', 'trial-18-dias')
      AND s.status <> 'pending'
  ) THEN
    RETURN NULL;
  END IF;

  -- 3. O teste continua válido até ao instante exacto do fim.
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
      AND p.slug = 'trial-18-dias'
      AND s.status = 'active'
      AND s.current_period_end > now()
  ) THEN
    RETURN 'trial-18-dias';
  END IF;

  -- 4. Teste histórico expirado: usar Grátis.
  -- Subscrições pagas pendentes não impedem este fallback.
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
      AND p.slug = 'trial-18-dias'
  ) THEN
    RETURN 'gratis';
  END IF;

  -- 5. Respeitar um plano Grátis explícito e activo.
  IF EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.business_id = p_business_id
      AND p.slug = 'gratis'
      AND s.status = 'active'
  ) THEN
    RETURN 'gratis';
  END IF;

  -- Sem plano válido nem histórico de teste.
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.effective_plan_slug(uuid)
  FROM PUBLIC, anon, authenticated;


-- 2. O acesso continua válido para o teste e para o Grátis.
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  p_business_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT public.effective_plan_slug(p_business_id) IS NOT NULL;
$function$;

-- 3. Bloquear operações apenas quando não existe plano efectivo.
CREATE OR REPLACE FUNCTION public.require_active_subscription(
  p_business_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF public.effective_plan_slug(p_business_id) IS NOT NULL THEN
    RETURN;
  END IF;

  RAISE EXCEPTION
    'A subscrição expirou. Escolha um plano para continuar a realizar operações.'
    USING ERRCODE = '42501';
END;
$function$;

-- 4. Criar produto com limite transaccional de 5 produtos activos no Grátis.
CREATE OR REPLACE FUNCTION public.create_product(
  p_business_id uuid,
  p_name text,
  p_category_id uuid,
  p_cost_price numeric,
  p_selling_price numeric,
  p_initial_stock integer,
  p_low_stock_threshold integer
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_product public.products;
  v_plan_slug text;
  v_product_count integer;
BEGIN
  IF public.current_user_role(p_business_id) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas o administrador pode criar produtos';
  END IF;

  PERFORM public.require_active_subscription(p_business_id);

  -- Serializa a verificação do limite entre operações concorrentes.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_business_id::text)::bigint
  );

  v_plan_slug := public.effective_plan_slug(p_business_id);

  IF v_plan_slug = 'gratis' THEN
    SELECT count(*)::integer
      INTO v_product_count
    FROM public.products
    WHERE business_id = p_business_id
      AND is_active = true;

    IF v_product_count >= 5 THEN
      RAISE EXCEPTION
        'O plano Grátis permite até 5 produtos activos. Desactive um produto ou escolha um plano pago.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'O nome do produto é obrigatório';
  END IF;

  IF p_selling_price IS NULL OR p_selling_price < 0 THEN
    RAISE EXCEPTION 'O preço de venda é obrigatório e não pode ser negativo';
  END IF;

  IF p_cost_price IS NOT NULL AND p_cost_price < 0 THEN
    RAISE EXCEPTION 'O custo não pode ser negativo';
  END IF;

  INSERT INTO public.products (
    business_id, name, category_id, cost_price, selling_price,
    stock_quantity, low_stock_threshold
  )
  VALUES (
    p_business_id,
    trim(p_name),
    p_category_id,
    p_cost_price,
    p_selling_price,
    greatest(coalesce(p_initial_stock, 0), 0),
    coalesce(p_low_stock_threshold, 5)
  )
  RETURNING * INTO v_product;

  IF coalesce(p_initial_stock, 0) > 0 THEN
    INSERT INTO public.stock_movements (
      business_id, product_id, type, quantity, note, created_by
    )
    VALUES (
      p_business_id, v_product.id, 'entrada',
      p_initial_stock, 'Stock inicial', auth.uid()
    );
  END IF;

  RETURN v_product;
END;
$function$;

-- 5. Limite de 30 vendas por mês no Grátis.
-- A venda, os itens e os movimentos de stock continuam atómicos.
CREATE OR REPLACE FUNCTION public.create_sale(
  p_business_id uuid,
  p_payment_method text,
  p_customer_id uuid,
  p_items jsonb
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sale public.sales;
  v_product public.products;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2) := 0;
  v_plan_slug text;
  v_sales_count integer;
  v_month_start timestamptz;
BEGIN
  IF public.current_user_role(p_business_id) IS NULL THEN
    RAISE EXCEPTION 'Sem permissão para registar vendas neste negócio';
  END IF;

  PERFORM public.require_active_subscription(p_business_id);

  -- Evita que vendas concorrentes ultrapassem o limite mensal.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_business_id::text)::bigint
  );

  v_plan_slug := public.effective_plan_slug(p_business_id);

  IF v_plan_slug = 'gratis' THEN
    v_month_start :=
      date_trunc('month', now() AT TIME ZONE 'Africa/Maputo')
      AT TIME ZONE 'Africa/Maputo';

    SELECT count(*)::integer
      INTO v_sales_count
    FROM public.sales
    WHERE business_id = p_business_id
      AND created_at >= v_month_start
      AND created_at < v_month_start + interval '1 month';

    IF v_sales_count >= 30 THEN
      RAISE EXCEPTION
        'O plano Grátis permite até 30 vendas por mês. Escolha um plano pago para continuar.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF p_payment_method NOT IN ('pago', 'credito') THEN
    RAISE EXCEPTION 'Método de pagamento inválido';
  END IF;

  IF jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A venda deve ter pelo menos um item';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS item
    GROUP BY item ->> 'product_id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cada produto só pode aparecer uma vez na venda';
  END IF;

  IF p_payment_method = 'credito' AND p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Uma venda a crédito exige um cliente';
  END IF;

  IF p_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE id = p_customer_id
      AND business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado neste negócio';
  END IF;

  INSERT INTO public.sales (
    business_id, customer_id, payment_method, created_by
  )
  VALUES (
    p_business_id, p_customer_id, p_payment_method, auth.uid()
  )
  RETURNING * INTO v_sale;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Item de venda inválido';
    END;

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Cada item precisa de produto e quantidade positiva';
    END IF;

    UPDATE public.products
       SET stock_quantity = stock_quantity - v_quantity
     WHERE id = v_product_id
       AND business_id = p_business_id
       AND is_active = true
       AND stock_quantity >= v_quantity
    RETURNING * INTO v_product;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'Stock insuficiente ou produto indisponível';
    END IF;

    v_subtotal := v_product.selling_price * v_quantity;
    v_total := v_total + v_subtotal;

    INSERT INTO public.sale_items (
      sale_id, product_id, quantity, unit_price, subtotal, cost_price
    )
    VALUES (
      v_sale.id, v_product.id, v_quantity,
      v_product.selling_price, v_subtotal, v_product.cost_price
    );

    INSERT INTO public.stock_movements (
      business_id, product_id, type, quantity, note,
      reference_type, reference_id, created_by
    )
    VALUES (
      p_business_id, v_product.id, 'venda', -v_quantity, 'Venda',
      'sale', v_sale.id, auth.uid()
    );
  END LOOP;

  UPDATE public.sales
     SET total_amount = v_total
   WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  IF p_payment_method = 'credito' THEN
    INSERT INTO public.debts (
      business_id, customer_id, sale_id, total_amount
    )
    VALUES (
      p_business_id, p_customer_id, v_sale.id, v_total
    );
  END IF;

  RETURN v_sale;
END;
$function$;

-- Preservar os privilégios das RPCs já protegidas pelas migrações anteriores.
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.require_active_subscription(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_active_subscription(uuid)
  TO authenticated;

REVOKE ALL ON FUNCTION public.create_product(
  uuid, text, uuid, numeric, numeric, integer, integer
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_product(
  uuid, text, uuid, numeric, numeric, integer, integer
) TO authenticated;

REVOKE ALL ON FUNCTION public.create_sale(uuid, text, uuid, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid, text, uuid, jsonb)
  TO authenticated;

COMMIT;
