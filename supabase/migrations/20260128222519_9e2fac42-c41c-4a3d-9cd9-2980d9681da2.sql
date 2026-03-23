-- Harden process_material_consumption to prevent abuse and reduce risk from elevated-privilege execution
CREATE OR REPLACE FUNCTION public.process_material_consumption(
  p_appointment_id uuid,
  p_materials jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_clinic_id UUID;
  v_procedure_id UUID;
  v_professional_id UUID;
  v_patient_id UUID;
  v_user_id UUID;
  v_user_clinic_id UUID;
  v_auto_consumption BOOLEAN;

  v_material JSONB;
  v_material_id UUID;
  v_kit_id UUID;
  v_quantity NUMERIC;
  v_unit TEXT;
  v_unit_cost NUMERIC;
  v_consumption_type TEXT;
  v_source TEXT;

  v_consumed_count INT := 0;
  v_alerts_count INT := 0;
  v_total_cost NUMERIC := 0;

  v_material_exists BOOLEAN;
BEGIN
  -- Basic input validation
  IF p_appointment_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Atendimento inválido');
  END IF;

  IF p_materials IS NULL OR jsonb_typeof(p_materials) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lista de materiais inválida');
  END IF;

  -- Auth check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autenticado');
  END IF;

  -- Get appointment details
  SELECT
    a.clinic_id,
    a.procedure_id,
    a.professional_id,
    a.patient_id
  INTO v_clinic_id, v_procedure_id, v_professional_id, v_patient_id
  FROM public.appointments a
  WHERE a.id = p_appointment_id;

  IF v_clinic_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Atendimento não encontrado');
  END IF;

  -- Enforce tenant isolation (even though this function runs with elevated privileges)
  v_user_clinic_id := public.user_clinic_id(v_user_id);
  IF v_user_clinic_id IS NULL OR v_user_clinic_id <> v_clinic_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;

  -- Enforce authorization for stock-changing operations
  IF NOT public.is_clinic_admin(v_user_id, v_clinic_id)
     AND NOT public.user_has_module_permission(v_user_id, 'estoque'::public.app_module, 'edit'::public.app_action) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão insuficiente');
  END IF;

  -- Check if auto consumption is enabled
  SELECT auto_material_consumption INTO v_auto_consumption
  FROM public.clinics
  WHERE id = v_clinic_id;

  IF NOT COALESCE(v_auto_consumption, false) THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Baixa automática desativada',
      'consumed_count', 0,
      'total_cost', 0
    );
  END IF;

  -- Process each material from the JSON array
  FOR v_material IN SELECT * FROM jsonb_array_elements(p_materials)
  LOOP
    IF jsonb_typeof(v_material) <> 'object' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item de material inválido');
    END IF;

    -- Required fields
    IF NULLIF(v_material->>'material_id', '') IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'material_id obrigatório');
    END IF;

    v_material_id := (v_material->>'material_id')::UUID;
    v_kit_id := NULLIF(v_material->>'kit_id', '')::UUID;

    v_quantity := COALESCE(NULLIF(v_material->>'quantity', '')::NUMERIC, 0);
    IF v_quantity <= 0 OR v_quantity > 10000 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Quantidade inválida');
    END IF;

    v_unit := COALESCE(NULLIF(v_material->>'unit', ''), 'unidade');
    IF length(v_unit) > 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unidade inválida');
    END IF;

    v_unit_cost := COALESCE(NULLIF(v_material->>'unit_cost', '')::NUMERIC, 0);
    IF v_unit_cost < 0 OR v_unit_cost > 1000000 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Custo unitário inválido');
    END IF;

    v_consumption_type := COALESCE(NULLIF(v_material->>'consumption_type', ''), 'automatic');
    IF v_consumption_type NOT IN ('automatic', 'manual') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tipo de consumo inválido');
    END IF;

    v_source := COALESCE(NULLIF(v_material->>'source', ''), 'procedure');
    IF v_source NOT IN ('procedure', 'kit', 'custom') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Origem inválida');
    END IF;

    -- Ensure material belongs to the same clinic and is active
    SELECT EXISTS(
      SELECT 1
      FROM public.materials m
      WHERE m.id = v_material_id
        AND m.clinic_id = v_clinic_id
        AND COALESCE(m.is_active, true) = true
    ) INTO v_material_exists;

    IF NOT COALESCE(v_material_exists, false) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Material inválido');
    END IF;

    -- Insert consumption record
    INSERT INTO public.material_consumption (
      clinic_id,
      appointment_id,
      procedure_id,
      material_id,
      kit_id,
      professional_id,
      patient_id,
      quantity,
      unit,
      unit_cost,
      consumption_type,
      source,
      created_by
    ) VALUES (
      v_clinic_id,
      p_appointment_id,
      v_procedure_id,
      v_material_id,
      v_kit_id,
      v_professional_id,
      v_patient_id,
      v_quantity,
      v_unit,
      v_unit_cost,
      v_consumption_type,
      v_source,
      v_user_id
    );

    v_consumed_count := v_consumed_count + 1;
    v_total_cost := v_total_cost + (v_quantity * v_unit_cost);

    -- Update material stock (decrease)
    UPDATE public.materials
    SET current_stock = current_stock - v_quantity
    WHERE id = v_material_id
      AND is_active = true;

    -- Check for low stock and create alert if needed
    INSERT INTO public.stock_alerts (
      clinic_id,
      material_id,
      alert_type,
      current_quantity,
      min_quantity,
      required_quantity,
      appointment_id
    )
    SELECT
      v_clinic_id,
      m.id,
      CASE
        WHEN m.current_stock - v_quantity <= 0 THEN 'out_of_stock'
        WHEN m.current_stock - v_quantity < m.min_quantity THEN 'low_stock'
        ELSE NULL
      END,
      m.current_stock - v_quantity,
      m.min_quantity,
      v_quantity,
      p_appointment_id
    FROM public.materials m
    WHERE m.id = v_material_id
      AND (
        m.current_stock - v_quantity <= 0
        OR m.current_stock - v_quantity < m.min_quantity
      );

    IF FOUND THEN
      v_alerts_count := v_alerts_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'consumed_count', v_consumed_count,
    'alerts_count', v_alerts_count,
    'total_cost', v_total_cost
  );
END;
$function$;