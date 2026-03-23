-- =============================================
-- APRIMORAR FUNÇÃO DE CONSUMO DE PRODUTOS
-- Para registrar custo histórico e rastreabilidade completa
-- =============================================

-- Atualizar a função de consumo para incluir material_consumption
CREATE OR REPLACE FUNCTION public.process_procedure_product_consumption(p_appointment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_appointment RECORD;
  v_clinic_id UUID;
  v_procedure_id UUID;
  v_professional_id UUID;
  v_patient_id UUID;
  v_user_id UUID;
  v_user_clinic_id UUID;
  v_now TIMESTAMPTZ := now();
  
  v_product RECORD;
  v_proc_product RECORD;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  v_unit_cost NUMERIC;
  
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

  -- Get appointment details with professional and patient
  SELECT 
    id,
    clinic_id,
    procedure_id,
    professional_id,
    patient_id,
    status
  INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  v_clinic_id := v_appointment.clinic_id;
  v_procedure_id := v_appointment.procedure_id;
  v_professional_id := v_appointment.professional_id;
  v_patient_id := v_appointment.patient_id;

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
    -- Return existing cost from the appointment
    SELECT COALESCE(procedure_cost, 0) INTO v_total_cost
    FROM public.appointments WHERE id = p_appointment_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Consumo já processado anteriormente',
      'processed_count', 0,
      'total_cost', v_total_cost
    );
  END IF;

  -- Process each product linked to the procedure
  FOR v_proc_product IN 
    SELECT 
      pp.product_id,
      pp.quantity,
      pp.notes,
      p.name as product_name,
      p.stock_quantity,
      p.cost_price,
      p.min_stock_quantity,
      p.unit
    FROM public.procedure_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.procedure_id = v_procedure_id
      AND p.is_active = true
  LOOP
    -- Get current unit cost (capture at execution time for historical accuracy)
    v_unit_cost := COALESCE(v_proc_product.cost_price, 0);
    
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
      v_unit_cost,
      COALESCE(v_proc_product.quantity, 0) * v_unit_cost,
      'PROCEDURE_USE',
      'procedure_execution',
      p_appointment_id::TEXT,
      'Consumo automático - Procedimento: ' || COALESCE(v_proc_product.product_name, 'N/A'),
      v_user_id,
      v_now
    );

    -- Also insert into material_consumption for detailed tracking
    -- This is a parallel record for procedure-specific tracking
    INSERT INTO public.material_consumption (
      clinic_id,
      appointment_id,
      procedure_id,
      material_id,
      professional_id,
      patient_id,
      quantity,
      unit,
      unit_cost,
      total_cost,
      consumption_type,
      source,
      consumed_at,
      created_by
    ) VALUES (
      v_clinic_id,
      p_appointment_id,
      v_procedure_id,
      v_proc_product.product_id,
      v_professional_id,
      v_patient_id,
      v_proc_product.quantity,
      COALESCE(v_proc_product.unit, 'unidade'),
      v_unit_cost,
      COALESCE(v_proc_product.quantity, 0) * v_unit_cost,
      'automatic',
      'procedure',
      v_now,
      v_user_id
    );

    -- Update product stock
    UPDATE public.products
    SET 
      stock_quantity = v_new_qty,
      updated_at = v_now
    WHERE id = v_proc_product.product_id;

    v_processed_count := v_processed_count + 1;
    v_total_cost := v_total_cost + (COALESCE(v_proc_product.quantity, 0) * v_unit_cost);

    -- Check for low stock alerts
    IF v_new_qty <= 0 OR v_new_qty < COALESCE(v_proc_product.min_stock_quantity, 0) THEN
      v_alerts_count := v_alerts_count + 1;
    END IF;
  END LOOP;

  -- Store the historical cost on the appointment
  UPDATE public.appointments
  SET procedure_cost = v_total_cost
  WHERE id = p_appointment_id;

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

-- Add index for efficient material_consumption queries by appointment
CREATE INDEX IF NOT EXISTS idx_material_consumption_appointment 
ON public.material_consumption(appointment_id);

-- Add index for timeline queries
CREATE INDEX IF NOT EXISTS idx_material_consumption_patient_date 
ON public.material_consumption(patient_id, consumed_at DESC);

-- Update calculate_procedure_cost to use products (not just materials)
CREATE OR REPLACE FUNCTION public.calculate_procedure_cost_from_products(p_procedure_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_cost NUMERIC := 0;
BEGIN
    -- Calculate cost from linked products using cost_price
    SELECT COALESCE(SUM(pp.quantity * COALESCE(p.cost_price, 0)), 0)
    INTO total_cost
    FROM public.procedure_products pp
    JOIN public.products p ON p.id = pp.product_id
    WHERE pp.procedure_id = p_procedure_id
      AND p.is_active = true;
    
    RETURN total_cost;
END;
$function$;