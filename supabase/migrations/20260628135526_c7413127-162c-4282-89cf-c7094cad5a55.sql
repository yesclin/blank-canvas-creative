CREATE OR REPLACE FUNCTION public.default_public_booking_week_schedule()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'seg', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'ter', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'qua', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'qui', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'sex', jsonb_build_object('enabled', true, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'sab', jsonb_build_object('enabled', false, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
    'dom', jsonb_build_object('enabled', false, 'open', '08:00', 'close', '18:00', 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00')
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_public_booking_default_schedule(_clinic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening_hours jsonb;
  v_existing_count integer;
BEGIN
  SELECT COUNT(*)
    INTO v_existing_count
  FROM public.clinic_schedule_config csc
  WHERE csc.clinic_id = _clinic_id;

  IF v_existing_count > 0 THEN
    RETURN;
  END IF;

  SELECT c.opening_hours::jsonb
    INTO v_opening_hours
  FROM public.clinics c
  WHERE c.id = _clinic_id;

  INSERT INTO public.clinic_schedule_config (
    clinic_id,
    working_days,
    start_time,
    end_time,
    default_duration_minutes
  ) VALUES (
    _clinic_id,
    COALESCE(NULLIF(v_opening_hours, '{}'::jsonb), public.default_public_booking_week_schedule()),
    '08:00'::time,
    '18:00'::time,
    30
  )
  ON CONFLICT (clinic_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_ensure_public_booking_default_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_booking_enabled IS TRUE
     AND COALESCE(OLD.public_booking_enabled, false) IS DISTINCT FROM TRUE THEN
    PERFORM public.ensure_public_booking_default_schedule(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_public_booking_default_schedule_on_enable ON public.clinics;
CREATE TRIGGER ensure_public_booking_default_schedule_on_enable
AFTER UPDATE OF public_booking_enabled ON public.clinics
FOR EACH ROW
EXECUTE FUNCTION public.tg_ensure_public_booking_default_schedule();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id FROM public.clinics WHERE public_booking_enabled IS TRUE
  LOOP
    PERFORM public.ensure_public_booking_default_schedule(r.id);
  END LOOP;
END $$;

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
  v_professional_active boolean;
  v_use_default boolean;
  v_pro_days jsonb;
  v_pro_duration int;
  v_legacy_pro_days jsonb;
  v_legacy_pro_duration int;
  v_clinic_config_days jsonb;
  v_clinic_start time;
  v_clinic_end time;
  v_clinic_duration int;
  v_clinic_opening_hours jsonb;
BEGIN
  SELECT COALESCE(c.public_booking_enabled, false)
    INTO v_public_enabled
  FROM public.clinics c
  WHERE c.id = _clinic_id;

  IF v_public_enabled IS NOT TRUE THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = _professional_id
      AND p.clinic_id = _clinic_id
      AND p.is_active = true
  ) INTO v_professional_active;

  IF v_professional_active IS NOT TRUE THEN
    RETURN;
  END IF;

  -- 1º professional_schedule_config: só substitui a clínica quando o profissional não usa padrão.
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

  -- 2º professional_schedules legado.
  SELECT
    jsonb_build_object(
      'dom', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 0), '[]'::jsonb),
      'seg', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 1), '[]'::jsonb),
      'ter', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 2), '[]'::jsonb),
      'qua', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 3), '[]'::jsonb),
      'qui', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 4), '[]'::jsonb),
      'sex', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 5), '[]'::jsonb),
      'sab', COALESCE(jsonb_agg(jsonb_build_object('enabled', true, 'open', substring(ps.start_time::text, 1, 5), 'close', substring(ps.end_time::text, 1, 5), 'hasLunch', false, 'lunchStart', '12:00', 'lunchEnd', '13:00')) FILTER (WHERE ps.day_of_week = 6), '[]'::jsonb)
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

  -- 3º clinic_schedule_config salvo no painel administrativo.
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
      'seg', jsonb_build_object('enabled', v_clinic_config_days ? 'seg', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'ter', jsonb_build_object('enabled', v_clinic_config_days ? 'ter', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'qua', jsonb_build_object('enabled', v_clinic_config_days ? 'qua', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'qui', jsonb_build_object('enabled', v_clinic_config_days ? 'qui', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'sex', jsonb_build_object('enabled', v_clinic_config_days ? 'sex', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'sab', jsonb_build_object('enabled', v_clinic_config_days ? 'sab', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00'),
      'dom', jsonb_build_object('enabled', v_clinic_config_days ? 'dom', 'open', COALESCE(substring(v_clinic_start::text, 1, 5), '08:00'), 'close', COALESCE(substring(v_clinic_end::text, 1, 5), '18:00'), 'hasLunch', true, 'lunchStart', '12:00', 'lunchEnd', '13:00')
    );
    default_duration_minutes := COALESCE(v_clinic_duration, v_pro_duration, 30);
    source := 'clinic_schedule_config_legacy';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Compatibilidade: se ainda houver opening_hours antigo, usar antes do padrão rígido.
  SELECT c.opening_hours::jsonb
    INTO v_clinic_opening_hours
  FROM public.clinics c
  WHERE c.id = _clinic_id;

  IF v_clinic_opening_hours IS NOT NULL
     AND jsonb_typeof(v_clinic_opening_hours) = 'object'
     AND v_clinic_opening_hours <> '{}'::jsonb THEN
    working_days := v_clinic_opening_hours;
    default_duration_minutes := COALESCE(v_pro_duration, 30);
    source := 'clinic_opening_hours';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 4º padrão operacional para qualquer clínica pública ativa.
  working_days := public.default_public_booking_week_schedule();
  default_duration_minutes := COALESCE(v_pro_duration, 30);
  source := 'clinic_default_week';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.default_public_booking_week_schedule() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_public_booking_default_schedule(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_effective_schedule(uuid, uuid) TO anon, authenticated;