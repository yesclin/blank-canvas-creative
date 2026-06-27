CREATE OR REPLACE FUNCTION public.get_public_effective_schedule(
  _clinic_id uuid,
  _professional_id uuid
)
RETURNS TABLE (
  working_days jsonb,
  default_duration_minutes int,
  source text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_public_enabled boolean;
  v_use_default boolean;
  v_pro_days jsonb;
  v_pro_duration int;
  v_legacy_pro_days jsonb;
  v_legacy_pro_duration int;
  v_clinic_opening_hours jsonb;
  v_clinic_config_days jsonb;
  v_clinic_start time;
  v_clinic_end time;
  v_clinic_duration int;
  v_default_week jsonb := jsonb_build_object(
    'seg', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'ter', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'qua', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'qui', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'sex', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'sab', jsonb_build_object('enabled', false, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'dom', jsonb_build_object('enabled', false, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00')
  );
BEGIN
  SELECT COALESCE(c.public_booking_enabled, false), c.opening_hours::jsonb
    INTO v_public_enabled, v_clinic_opening_hours
  FROM public.clinics c
  WHERE c.id = _clinic_id;

  IF v_public_enabled IS NOT TRUE THEN
    RETURN;
  END IF;

  -- 1º: configuração individual nova do profissional, quando marcada para não usar padrão da clínica.
  SELECT psc.use_clinic_default, psc.working_days::jsonb, psc.default_duration_minutes
    INTO v_use_default, v_pro_days, v_pro_duration
  FROM public.professional_schedule_config psc
  WHERE psc.clinic_id = _clinic_id
    AND psc.professional_id = _professional_id
  ORDER BY psc.updated_at DESC NULLS LAST, psc.created_at DESC NULLS LAST
  LIMIT 1;

  IF COALESCE(v_use_default, true) = false
     AND v_pro_days IS NOT NULL
     AND jsonb_typeof(v_pro_days) = 'object'
     AND v_pro_days <> '{}'::jsonb THEN
    working_days := v_pro_days;
    default_duration_minutes := COALESCE(v_pro_duration, 30);
    source := 'professional_schedule_config';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 1º (compatibilidade): agenda individual legada ativa do profissional.
  SELECT
    jsonb_build_object(
      'dom', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 0), '[]'::jsonb),
      'seg', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 1), '[]'::jsonb),
      'ter', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 2), '[]'::jsonb),
      'qua', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 3), '[]'::jsonb),
      'qui', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 4), '[]'::jsonb),
      'sex', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 5), '[]'::jsonb),
      'sab', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', ps.start_time::text, 'close', ps.end_time::text, 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 6), '[]'::jsonb)
    ),
    MIN(ps.slot_duration_minutes)
    INTO v_legacy_pro_days, v_legacy_pro_duration
  FROM public.professional_schedules ps
  WHERE ps.clinic_id = _clinic_id
    AND ps.professional_id = _professional_id
    AND ps.is_active = true;

  IF v_legacy_pro_days IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM jsonb_each(v_legacy_pro_days) AS day_config(day_key, day_value)
       WHERE jsonb_typeof(day_value) = 'array'
         AND jsonb_array_length(day_value) > 0
     ) THEN
    working_days := v_legacy_pro_days;
    default_duration_minutes := COALESCE(v_legacy_pro_duration, v_pro_duration, 30);
    source := 'professional_schedules';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2º: horário geral da clínica salvo no cadastro principal.
  IF v_clinic_opening_hours IS NOT NULL
     AND jsonb_typeof(v_clinic_opening_hours) = 'object'
     AND v_clinic_opening_hours <> '{}'::jsonb THEN
    working_days := v_clinic_opening_hours;
    default_duration_minutes := COALESCE(v_pro_duration, 30);
    source := 'clinic_opening_hours';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2º: horário geral da clínica salvo na configuração de agenda.
  SELECT csc.working_days::jsonb, csc.start_time, csc.end_time, csc.default_duration_minutes
    INTO v_clinic_config_days, v_clinic_start, v_clinic_end, v_clinic_duration
  FROM public.clinic_schedule_config csc
  WHERE csc.clinic_id = _clinic_id
  ORDER BY csc.updated_at DESC NULLS LAST, csc.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_clinic_config_days IS NOT NULL
     AND jsonb_typeof(v_clinic_config_days) = 'object'
     AND v_clinic_config_days <> '{}'::jsonb THEN
    working_days := v_clinic_config_days;
    default_duration_minutes := COALESCE(v_clinic_duration, v_pro_duration, 30);
    source := 'clinic_schedule_config';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_clinic_config_days IS NOT NULL
     AND jsonb_typeof(v_clinic_config_days) = 'array'
     AND jsonb_array_length(v_clinic_config_days) > 0 THEN
    working_days := jsonb_build_object(
      'seg', jsonb_build_object('enabled', v_clinic_config_days ? 'seg', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'ter', jsonb_build_object('enabled', v_clinic_config_days ? 'ter', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'qua', jsonb_build_object('enabled', v_clinic_config_days ? 'qua', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'qui', jsonb_build_object('enabled', v_clinic_config_days ? 'qui', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'sex', jsonb_build_object('enabled', v_clinic_config_days ? 'sex', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'sab', jsonb_build_object('enabled', v_clinic_config_days ? 'sab', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'dom', jsonb_build_object('enabled', v_clinic_config_days ? 'dom', 'open', COALESCE(v_clinic_start::text, '08:00'), 'close', COALESCE(v_clinic_end::text, '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00')
    );
    default_duration_minutes := COALESCE(v_clinic_duration, v_pro_duration, 30);
    source := 'clinic_schedule_config_legacy';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Clínica pública sem configuração explícita: padrão operacional para permitir agendamento online inicial.
  working_days := v_default_week;
  default_duration_minutes := COALESCE(v_clinic_duration, v_pro_duration, 30);
  source := 'clinic_default_week';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_effective_schedule(uuid, uuid) TO anon, authenticated;