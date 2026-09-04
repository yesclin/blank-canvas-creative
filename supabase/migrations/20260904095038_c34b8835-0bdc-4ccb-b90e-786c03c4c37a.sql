CREATE OR REPLACE FUNCTION public.process_appointment_consumption(p_appointment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appt            RECORD;
  v_auto_deduct     boolean := true;
  v_existing        integer := 0;
  v_processed       integer := 0;
  v_alerts          jsonb := '[]'::jsonb;
  v_total_cost      numeric := 0;
  r                 RECORD;
  b                 RECORD;
  v_remaining       numeric;
  v_take            numeric;
  v_unit_cost       numeric;
  v_allocated       numeric;
BEGIN
  SELECT a.id, a.clinic_id, a.patient_id, a.professional_id, a.procedure_id, a.status
    INTO v_appt
  FROM public.appointments a
  WHERE a.id = p_appointment_id;

  IF v_appt.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Atendimento não encontrado');
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.can_access_clinic_as_staff(v_appt.clinic_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para esta clínica');
  END IF;

  IF v_appt.procedure_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'Atendimento sem procedimento vinculado',
                              'processed_count', 0, 'total_cost', 0, 'alerts_count', 0);
  END IF;

  SELECT COALESCE(p.auto_deduct_stock, true) INTO v_auto_deduct
  FROM public.procedures p WHERE p.id = v_appt.procedure_id;

  IF NOT COALESCE(v_auto_deduct, true) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Baixa automática desativada para este procedimento',
                              'processed_count', 0, 'total_cost', 0, 'alerts_count', 0);
  END IF;

  SELECT count(*) INTO v_existing
  FROM public.inventory_movements m
  WHERE m.appointment_id = p_appointment_id
    AND m.movement_type = 'procedure_consumption';

  IF v_existing > 0 THEN
    SELECT COALESCE(sum(m.total_cost), 0) INTO v_total_cost
    FROM public.inventory_movements m
    WHERE m.appointment_id = p_appointment_id
      AND m.movement_type = 'procedure_consumption';

    RETURN jsonb_build_object('success', true, 'message', 'Consumo já registrado',
                              'already_processed', true,
                              'processed_count', 0, 'total_cost', v_total_cost, 'alerts_count', 0);
  END IF;

  FOR r IN
    SELECT item_id, SUM(qty) AS qty
    FROM (
      SELECT t.item_id, t.default_quantity::numeric AS qty
      FROM public.procedure_consumption_templates t
      WHERE t.procedure_id = v_appt.procedure_id
        AND t.clinic_id = v_appt.clinic_id
      UNION ALL
      SELECT ki.item_id, (ki.quantity * COALESCE(pck.quantity, 1))::numeric AS qty
      FROM public.procedure_consumption_kits pck
      JOIN public.inventory_kit_items ki ON ki.kit_id = pck.kit_id
      WHERE pck.procedure_id = v_appt.procedure_id
        AND pck.clinic_id = v_appt.clinic_id
    ) s
    GROUP BY item_id
  LOOP
    v_remaining := r.qty;
    v_allocated := 0;

    FOR b IN
      SELECT ib.id, ib.quantity_available, ib.unit_cost
      FROM public.inventory_batches ib
      WHERE ib.item_id = r.item_id
        AND ib.clinic_id = v_appt.clinic_id
        AND COALESCE(ib.status, 'active') = 'active'
        AND ib.quantity_available > 0
      ORDER BY ib.expiry_date NULLS LAST, ib.created_at
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_take := LEAST(v_remaining, b.quantity_available);
      SELECT COALESCE(b.unit_cost, i.default_cost_price, 0) INTO v_unit_cost
      FROM public.inventory_items i WHERE i.id = r.item_id;

      INSERT INTO public.inventory_movements (
        clinic_id, item_id, batch_id, movement_type, quantity, unit_cost,
        reason, source_module, source_id, patient_id, professional_id, appointment_id
      ) VALUES (
        v_appt.clinic_id, r.item_id, b.id, 'procedure_consumption', v_take, v_unit_cost,
        'Consumo automático na finalização do atendimento', 'appointment_finish',
        p_appointment_id, v_appt.patient_id, v_appt.professional_id, p_appointment_id
      );

      UPDATE public.inventory_batches
         SET quantity_available = quantity_available - v_take,
             status = CASE WHEN quantity_available - v_take <= 0 THEN 'depleted' ELSE status END,
             updated_at = now()
       WHERE id = b.id;

      v_total_cost := v_total_cost + (v_unit_cost * v_take);
      v_remaining := v_remaining - v_take;
      v_allocated := v_allocated + v_take;
      v_processed := v_processed + 1;
    END LOOP;

    IF v_remaining > 0 THEN
      IF EXISTS (
        SELECT 1 FROM public.inventory_items i
        WHERE i.id = r.item_id AND COALESCE(i.controls_batch, false) = false
      ) THEN
        SELECT COALESCE(i.default_cost_price, 0) INTO v_unit_cost
        FROM public.inventory_items i WHERE i.id = r.item_id;

        INSERT INTO public.inventory_movements (
          clinic_id, item_id, batch_id, movement_type, quantity, unit_cost,
          reason, source_module, source_id, patient_id, professional_id, appointment_id
        ) VALUES (
          v_appt.clinic_id, r.item_id, NULL, 'procedure_consumption', v_remaining, v_unit_cost,
          'Consumo automático na finalização do atendimento', 'appointment_finish',
          p_appointment_id, v_appt.patient_id, v_appt.professional_id, p_appointment_id
        );

        v_total_cost := v_total_cost + (v_unit_cost * v_remaining);
        v_processed := v_processed + 1;
        v_allocated := v_allocated + v_remaining;
        v_remaining := 0;
      ELSE
        v_alerts := v_alerts || jsonb_build_object(
          'item_id', r.item_id,
          'item_name', (SELECT name FROM public.inventory_items WHERE id = r.item_id),
          'required', r.qty,
          'allocated', v_allocated,
          'missing', v_remaining
        );
      END IF;
    END IF;
  END LOOP;

  UPDATE public.appointments
     SET procedure_cost = v_total_cost,
         updated_at = now()
   WHERE id = p_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'processed_count', v_processed,
    'total_cost', v_total_cost,
    'alerts_count', jsonb_array_length(v_alerts),
    'alerts', v_alerts
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revert_appointment_consumption(p_appointment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m         RECORD;
  v_count   integer := 0;
  v_clinic  uuid;
BEGIN
  SELECT clinic_id INTO v_clinic FROM public.appointments WHERE id = p_appointment_id;
  IF v_clinic IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Atendimento não encontrado');
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.can_access_clinic_as_staff(v_clinic) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para esta clínica');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE appointment_id = p_appointment_id
      AND movement_type = 'return'
      AND source_module = 'appointment_revert'
  ) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Consumo já revertido', 'reverted_count', 0);
  END IF;

  FOR m IN
    SELECT * FROM public.inventory_movements
    WHERE appointment_id = p_appointment_id
      AND movement_type = 'procedure_consumption'
  LOOP
    INSERT INTO public.inventory_movements (
      clinic_id, item_id, batch_id, movement_type, quantity, unit_cost,
      reason, source_module, source_id, patient_id, professional_id, appointment_id
    ) VALUES (
      m.clinic_id, m.item_id, m.batch_id, 'return', m.quantity, m.unit_cost,
      'Reversão do consumo por cancelamento/reabertura do atendimento',
      'appointment_revert', p_appointment_id, m.patient_id, m.professional_id, p_appointment_id
    );

    IF m.batch_id IS NOT NULL THEN
      UPDATE public.inventory_batches
         SET quantity_available = quantity_available + m.quantity,
             status = CASE WHEN COALESCE(status,'active') = 'depleted' THEN 'active' ELSE status END,
             updated_at = now()
       WHERE id = m.batch_id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  IF v_count > 0 THEN
    UPDATE public.appointments SET procedure_cost = 0, updated_at = now()
     WHERE id = p_appointment_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'reverted_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.process_appointment_consumption(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revert_appointment_consumption(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_appointment_consumption(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revert_appointment_consumption(uuid) TO authenticated, service_role;