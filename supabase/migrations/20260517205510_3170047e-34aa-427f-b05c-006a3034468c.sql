
-- =====================================================================
-- create_sale_transaction: cria venda, itens, estoque e financeiro
-- em uma única transação atômica
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_clinic_id uuid,
  p_user_id uuid,
  p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal numeric := 0;
  v_discount_amount numeric := 0;
  v_discount_percent numeric := 0;
  v_total_amount numeric := 0;
  v_transaction_id uuid;
  v_allow_negative boolean := false;
  v_item jsonb;
  v_inv_item RECORD;
  v_legacy_product RECORD;
  v_current_stock numeric;
  v_qty numeric;
  v_unit_price numeric;
  v_item_discount numeric;
  v_cost_price numeric;
  v_total_price numeric;
  v_total_cost numeric;
  v_profit numeric;
  v_margin_pct numeric;
  v_items_count int := 0;
BEGIN
  -- 1. Validações iniciais
  IF p_payload->'items' IS NULL OR jsonb_array_length(p_payload->'items') = 0 THEN
    RAISE EXCEPTION 'EMPTY_ITEMS';
  END IF;

  -- Autorização: usuário pertence à clínica
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id AND clinic_id = p_clinic_id
  ) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  SELECT COALESCE(allow_negative_stock, false) INTO v_allow_negative
  FROM public.clinics WHERE id = p_clinic_id;

  IF COALESCE((p_payload->>'allow_negative_stock')::boolean, false) THEN
    v_allow_negative := true;
  END IF;

  v_sale_number := 'V' || upper(to_hex(extract(epoch from now())::bigint));
  v_discount_amount := COALESCE((p_payload->>'discount_amount')::numeric, 0);
  v_discount_percent := COALESCE((p_payload->>'discount_percent')::numeric, 0);

  -- Calcular subtotal
  FOR v_item IN SELECT jsonb_array_elements(p_payload->'items') LOOP
    v_subtotal := v_subtotal + (
      COALESCE((v_item->>'quantity')::numeric, 0)
      * COALESCE((v_item->>'unit_price')::numeric, 0)
    );
  END LOOP;

  IF v_discount_amount = 0 AND v_discount_percent > 0 THEN
    v_discount_amount := v_subtotal * (v_discount_percent / 100.0);
  END IF;
  v_total_amount := v_subtotal - v_discount_amount;

  -- 2. INSERT da venda
  INSERT INTO public.sales (
    clinic_id, sale_number, patient_id, professional_id, appointment_id,
    sale_date, subtotal, discount_amount, discount_percent, final_amount,
    total_amount, payment_method, payment_status, status, sale_origin,
    notes, created_by, sold_by
  ) VALUES (
    p_clinic_id,
    v_sale_number,
    NULLIF(p_payload->>'patient_id','')::uuid,
    NULLIF(p_payload->>'professional_id','')::uuid,
    NULLIF(p_payload->>'appointment_id','')::uuid,
    COALESCE((p_payload->>'sale_date')::timestamptz, now()),
    v_subtotal,
    v_discount_amount,
    v_discount_percent,
    v_total_amount,
    v_total_amount,
    NULLIF(p_payload->>'payment_method',''),
    COALESCE(p_payload->>'payment_status','pendente'),
    'completed',
    COALESCE(p_payload->>'sale_origin','counter'),
    NULLIF(p_payload->>'notes',''),
    p_user_id,
    p_user_id
  )
  RETURNING id INTO v_sale_id;

  -- 3. Para cada item: lock, valida estoque, insere sale_item + movimentação
  FOR v_item IN SELECT jsonb_array_elements(p_payload->'items') LOOP
    v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);
    v_item_discount := COALESCE((v_item->>'discount_amount')::numeric, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    -- Resolver item: inventory_items primeiro (master), depois products (legacy)
    SELECT id, default_cost_price, controls_stock, name
    INTO v_inv_item
    FROM public.inventory_items
    WHERE id = (v_item->>'product_id')::uuid AND clinic_id = p_clinic_id
    FOR UPDATE;

    v_legacy_product := NULL;
    IF NOT FOUND THEN
      SELECT id, stock_quantity, cost_price, name
      INTO v_legacy_product
      FROM public.products
      WHERE id = (v_item->>'product_id')::uuid AND clinic_id = p_clinic_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_item->>'product_name';
      END IF;

      v_cost_price := COALESCE(v_legacy_product.cost_price, 0);
      v_current_stock := COALESCE(v_legacy_product.stock_quantity, 0);

      IF NOT v_allow_negative AND v_qty > v_current_stock THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK:%:%:%', v_legacy_product.name, v_qty, v_current_stock;
      END IF;

      UPDATE public.products
        SET stock_quantity = v_current_stock - v_qty, updated_at = now()
        WHERE id = v_legacy_product.id;
    ELSE
      v_cost_price := COALESCE(v_inv_item.default_cost_price, 0);

      -- Calcular estoque atual a partir de inventory_movements
      SELECT COALESCE(SUM(
        CASE WHEN movement_type IN ('entry','adjustment_in','return_in')
             THEN quantity
             ELSE -quantity END
      ), 0) INTO v_current_stock
      FROM public.inventory_movements
      WHERE item_id = v_inv_item.id AND clinic_id = p_clinic_id;

      IF v_inv_item.controls_stock AND NOT v_allow_negative AND v_qty > v_current_stock THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK:%:%:%', v_inv_item.name, v_qty, v_current_stock;
      END IF;

      INSERT INTO public.inventory_movements (
        clinic_id, item_id, movement_type, quantity,
        unit_cost, total_cost, unit_sale_price,
        reason, source_module, source_id,
        patient_id, professional_id, appointment_id,
        notes, created_by
      ) VALUES (
        p_clinic_id, v_inv_item.id, 'sale', v_qty,
        v_cost_price, v_cost_price * v_qty, v_unit_price,
        'Venda ' || v_sale_number, 'sale', v_sale_id,
        NULLIF(p_payload->>'patient_id','')::uuid,
        NULLIF(p_payload->>'professional_id','')::uuid,
        NULLIF(p_payload->>'appointment_id','')::uuid,
        'Venda ' || v_sale_number, p_user_id
      );
    END IF;

    v_total_price := v_qty * v_unit_price - v_item_discount;
    v_total_cost := v_qty * v_cost_price;
    v_profit := v_total_price - v_total_cost;
    v_margin_pct := CASE WHEN v_total_price > 0 THEN (v_profit / v_total_price) * 100 ELSE 0 END;

    INSERT INTO public.sale_items (
      sale_id, product_id, item_id, item_type, product_name,
      quantity, unit_price, discount_amount, total_price,
      cost_price, cost_price_snapshot, total_cost,
      profit, margin_amount, margin_percent, notes
    ) VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'product_id')::uuid,
      'product',
      COALESCE(v_item->>'product_name', COALESCE(v_inv_item.name, v_legacy_product.name)),
      v_qty, v_unit_price, v_item_discount, v_total_price,
      v_cost_price, v_cost_price, v_total_cost,
      v_profit, v_profit, v_margin_pct,
      NULLIF(v_item->>'notes','')
    );

    v_items_count := v_items_count + 1;
  END LOOP;

  -- 4. Lançamento financeiro
  IF v_total_amount > 0 THEN
    INSERT INTO public.finance_transactions (
      clinic_id, type, status, description, amount,
      transaction_date, payment_method,
      patient_id, professional_id,
      origin, reference_type, reference_id, created_by
    ) VALUES (
      p_clinic_id, 'receita', 'pago',
      'Venda ' || v_sale_number, v_total_amount,
      COALESCE((p_payload->>'sale_date')::date, current_date),
      NULLIF(p_payload->>'payment_method',''),
      NULLIF(p_payload->>'patient_id','')::uuid,
      NULLIF(p_payload->>'professional_id','')::uuid,
      'venda', 'sale', v_sale_id, p_user_id
    )
    RETURNING id INTO v_transaction_id;

    UPDATE public.sales SET transaction_id = v_transaction_id WHERE id = v_sale_id;
  END IF;

  -- 5. Auditoria
  INSERT INTO public.access_logs (
    clinic_id, user_id, action, resource_type, resource_id
  ) VALUES (
    p_clinic_id, p_user_id, 'SALE_CREATED', 'sale', v_sale_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'total_amount', v_total_amount,
    'transaction_id', v_transaction_id,
    'items_count', v_items_count
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Toda a transação é descartada automaticamente pelo Postgres
    RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_sale_transaction(uuid, uuid, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.create_sale_transaction(uuid, uuid, jsonb) TO authenticated, service_role;


-- =====================================================================
-- cancel_sale_transaction: reverte venda, estoque e financeiro
-- =====================================================================
CREATE OR REPLACE FUNCTION public.cancel_sale_transaction(
  p_sale_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT 'Cancelamento de venda'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_item RECORD;
  v_items_reverted int := 0;
  v_amount_reversed numeric := 0;
BEGIN
  -- Lock da venda para evitar cancelamento concorrente
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venda não encontrada');
  END IF;

  -- Autorização
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id AND clinic_id = v_sale.clinic_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem acesso a esta clínica');
  END IF;

  IF v_sale.status = 'cancelled' OR v_sale.canceled_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Venda já está cancelada');
  END IF;

  -- Reverter estoque para cada item
  FOR v_item IN
    SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
  LOOP
    -- inventory_items (caminho master)
    IF EXISTS (
      SELECT 1 FROM public.inventory_items
      WHERE id = COALESCE(v_item.item_id, v_item.product_id)
        AND clinic_id = v_sale.clinic_id
    ) THEN
      INSERT INTO public.inventory_movements (
        clinic_id, item_id, movement_type, quantity,
        unit_cost, total_cost,
        reason, source_module, source_id,
        notes, created_by
      ) VALUES (
        v_sale.clinic_id,
        COALESCE(v_item.item_id, v_item.product_id),
        'return_in', v_item.quantity,
        v_item.cost_price_snapshot, v_item.cost_price_snapshot * v_item.quantity,
        'Estorno: ' || COALESCE(p_reason, 'cancelamento'),
        'sale', p_sale_id,
        'Cancelamento da venda ' || COALESCE(v_sale.sale_number, p_sale_id::text),
        p_user_id
      );
    END IF;

    -- products legacy
    IF EXISTS (
      SELECT 1 FROM public.products
      WHERE id = v_item.product_id AND clinic_id = v_sale.clinic_id
    ) THEN
      UPDATE public.products
        SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_id;
    END IF;

    v_items_reverted := v_items_reverted + 1;
  END LOOP;

  -- Reverter financeiro
  IF v_sale.transaction_id IS NOT NULL THEN
    UPDATE public.finance_transactions
      SET status = 'cancelado',
          notes = COALESCE(notes || E'\n', '') || 'Cancelado: ' || COALESCE(p_reason,''),
          updated_at = now()
      WHERE id = v_sale.transaction_id;
    v_amount_reversed := COALESCE(v_sale.total_amount, v_sale.final_amount, 0);
  END IF;

  -- Marcar venda como cancelada
  UPDATE public.sales
    SET status = 'cancelled',
        canceled_at = now(),
        canceled_by = p_user_id,
        notes = COALESCE(notes || E'\n', '') || 'Cancelamento: ' || COALESCE(p_reason,''),
        updated_at = now()
    WHERE id = p_sale_id;

  -- Auditoria
  INSERT INTO public.access_logs (
    clinic_id, user_id, action, resource_type, resource_id
  ) VALUES (
    v_sale.clinic_id, p_user_id, 'SALE_CANCELLED', 'sale', p_sale_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', p_sale_id,
    'items_reverted', v_items_reverted,
    'amount_reversed', v_amount_reversed,
    'message', 'Venda cancelada com sucesso'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_sale_transaction(uuid, uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.cancel_sale_transaction(uuid, uuid, text) TO authenticated, service_role;
