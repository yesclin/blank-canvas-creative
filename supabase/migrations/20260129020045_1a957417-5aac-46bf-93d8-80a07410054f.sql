-- Create a transactional function for sale cancellation
CREATE OR REPLACE FUNCTION public.cancel_sale_transaction(
  p_sale_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Cancelamento de venda'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_item RECORD;
  v_clinic_id UUID;
  v_product RECORD;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  v_now TIMESTAMPTZ := now();
  v_items_reverted INT := 0;
  v_reversal_tx_id UUID;
BEGIN
  -- Step 1: Get and lock the sale record
  SELECT * INTO v_sale
  FROM sales
  WHERE id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Venda não encontrada');
  END IF;

  v_clinic_id := v_sale.clinic_id;

  -- Check if already canceled
  IF v_sale.status = 'cancelado' OR v_sale.payment_status = 'cancelado' THEN
    RETURN json_build_object('success', false, 'error', 'Venda já está cancelada');
  END IF;

  -- Step 2: Update sale status to canceled
  UPDATE sales
  SET 
    status = 'cancelado',
    payment_status = 'cancelado',
    canceled_at = v_now,
    canceled_by = p_user_id,
    updated_at = v_now
  WHERE id = p_sale_id;

  -- Step 3: Revert stock for each item
  FOR v_item IN 
    SELECT * FROM sale_items WHERE sale_id = p_sale_id
  LOOP
    -- Get current product stock with lock
    SELECT * INTO v_product
    FROM products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF FOUND THEN
      v_previous_qty := COALESCE(v_product.stock_quantity, 0);
      v_new_qty := v_previous_qty + COALESCE(v_item.quantity, 0);

      -- Create stock movement (entrada = IN)
      INSERT INTO stock_movements (
        clinic_id,
        product_id,
        movement_type,
        quantity,
        previous_quantity,
        new_quantity,
        reason,
        reference_type,
        reference_id,
        created_by,
        created_at
      ) VALUES (
        v_clinic_id,
        v_item.product_id,
        'entrada',
        v_item.quantity,
        v_previous_qty,
        v_new_qty,
        'SALE_CANCEL: ' || p_reason,
        'sale',
        p_sale_id,
        p_user_id,
        v_now
      );

      -- Update product stock
      UPDATE products
      SET 
        stock_quantity = v_new_qty,
        updated_at = v_now
      WHERE id = v_item.product_id;

      v_items_reverted := v_items_reverted + 1;
    END IF;
  END LOOP;

  -- Step 4: Handle financial reversal
  -- Mark original transaction as reversed if exists
  IF v_sale.transaction_id IS NOT NULL THEN
    UPDATE finance_transactions
    SET 
      notes = '[ESTORNADO] ' || COALESCE(notes, '') || ' - Cancelamento em ' || to_char(v_now, 'DD/MM/YYYY'),
      updated_at = v_now
    WHERE id = v_sale.transaction_id;
  END IF;

  -- Create reversal transaction
  IF COALESCE(v_sale.total_amount, 0) > 0 THEN
    INSERT INTO finance_transactions (
      clinic_id,
      type,
      description,
      amount,
      transaction_date,
      payment_method,
      patient_id,
      professional_id,
      origin,
      notes,
      created_by,
      created_at
    ) VALUES (
      v_clinic_id,
      'saida',
      'Estorno - Cancelamento de venda #' || LEFT(p_sale_id::text, 8),
      v_sale.total_amount,
      v_now::date,
      v_sale.payment_method,
      v_sale.patient_id,
      v_sale.professional_id,
      'sale_cancellation',
      'Estorno referente à venda cancelada. Motivo: ' || p_reason || '. Venda original: ' || p_sale_id,
      p_user_id,
      v_now
    )
    RETURNING id INTO v_reversal_tx_id;
  END IF;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Venda cancelada com sucesso',
    'sale_id', p_sale_id,
    'items_reverted', v_items_reverted,
    'amount_reversed', COALESCE(v_sale.total_amount, 0),
    'reversal_transaction_id', v_reversal_tx_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;