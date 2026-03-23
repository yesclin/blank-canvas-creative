-- Create a transactional function to process procedure product consumption
-- This handles stock movements and updates when a procedure is finalized

CREATE OR REPLACE FUNCTION public.process_procedure_product_consumption(
  p_appointment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment RECORD;
  v_clinic_id UUID;
  v_procedure_id UUID;
  v_user_id UUID;
  v_user_clinic_id UUID;
  v_now TIMESTAMPTZ := now();
  
  v_product RECORD;
  v_proc_product RECORD;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  
  v_processed_count INT := 0;
  v_total_cost NUMERIC := 0;
  v_alerts_count INT := 0;
BEGIN
  -- Validate input
  IF p_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID do agendamento inválido');
  END IF;

  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Get appointment details
  SELECT 
    id,
    clinic_id,
    procedure_id,
    status
  INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  v_clinic_id := v_appointment.clinic_id;
  v_procedure_id := v_appointment.procedure_id;

  -- Tenant isolation check
  v_user_clinic_id := public.user_clinic_id(v_user_id);
  IF v_user_clinic_id IS NULL OR v_user_clinic_id <> v_clinic_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Check if procedure exists
  IF v_procedure_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Agendamento sem procedimento vinculado',
      'processed_count', 0,
      'total_cost', 0
    );
  END IF;

  -- Check if already processed (prevent double processing)
  IF EXISTS (
    SELECT 1 FROM public.stock_movements 
    WHERE reference_type = 'procedure_execution' 
    AND reference_id = p_appointment_id::TEXT
    LIMIT 1
  ) THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Consumo já processado anteriormente',
      'processed_count', 0,
      'total_cost', 0
    );
  END IF;

  -- Process each product linked to the procedure
  FOR v_proc_product IN 
    SELECT 
      pp.product_id,
      pp.quantity,
      p.name as product_name,
      p.stock_quantity,
      p.cost_price,
      p.min_stock_quantity
    FROM public.procedure_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.procedure_id = v_procedure_id
      AND p.is_active = true
  LOOP
    -- Get current stock with lock
    SELECT stock_quantity INTO v_previous_qty
    FROM public.products
    WHERE id = v_proc_product.product_id
    FOR UPDATE;

    v_previous_qty := COALESCE(v_previous_qty, 0);
    v_new_qty := v_previous_qty - COALESCE(v_proc_product.quantity, 0);

    -- Create stock movement (saida = OUT)
    INSERT INTO public.stock_movements (
      clinic_id,
      product_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_cost,
      total_cost,
      reason,
      reference_type,
      reference_id,
      notes,
      created_by,
      created_at
    ) VALUES (
      v_clinic_id,
      v_proc_product.product_id,
      'saida',
      v_proc_product.quantity,
      v_previous_qty,
      v_new_qty,
      COALESCE(v_proc_product.cost_price, 0),
      COALESCE(v_proc_product.quantity, 0) * COALESCE(v_proc_product.cost_price, 0),
      'PROCEDURE_USE',
      'procedure_execution',
      p_appointment_id::TEXT,
      'Consumo automático - Procedimento: ' || COALESCE(v_proc_product.product_name, 'N/A'),
      v_user_id,
      v_now
    );

    -- Update product stock
    UPDATE public.products
    SET 
      stock_quantity = v_new_qty,
      updated_at = v_now
    WHERE id = v_proc_product.product_id;

    v_processed_count := v_processed_count + 1;
    v_total_cost := v_total_cost + (COALESCE(v_proc_product.quantity, 0) * COALESCE(v_proc_product.cost_price, 0));

    -- Check for low stock alerts
    IF v_new_qty <= 0 OR v_new_qty < COALESCE(v_proc_product.min_stock_quantity, 0) THEN
      v_alerts_count := v_alerts_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Consumo de produtos processado com sucesso',
    'processed_count', v_processed_count,
    'total_cost', v_total_cost,
    'alerts_count', v_alerts_count,
    'appointment_id', p_appointment_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.process_procedure_product_consumption(UUID) IS 
'Processa o consumo de produtos vinculados a um procedimento quando o atendimento é finalizado. 
Cria movimentações de estoque (saída) e atualiza o estoque dos produtos de forma transacional.';