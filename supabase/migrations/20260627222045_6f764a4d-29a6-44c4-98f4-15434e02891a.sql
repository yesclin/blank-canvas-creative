
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
  v_clinic_days jsonb;
BEGIN
  SELECT c.public_booking_enabled INTO v_public_enabled
  FROM clinics c WHERE c.id = _clinic_id;

  IF v_public_enabled IS NOT TRUE THEN
    RETURN;
  END IF;

  -- professional-specific config
  SELECT psc.use_clinic_default, psc.working_days::jsonb, psc.default_duration_minutes
    INTO v_use_default, v_pro_days, v_pro_duration
  FROM professional_schedule_config psc
  WHERE psc.clinic_id = _clinic_id AND psc.professional_id = _professional_id
  LIMIT 1;

  -- clinic opening hours (WeekSchedule json)
  SELECT c.opening_hours::jsonb INTO v_clinic_days
  FROM clinics c WHERE c.id = _clinic_id;

  IF v_pro_days IS NOT NULL AND COALESCE(v_use_default, true) = false THEN
    working_days := v_pro_days;
    default_duration_minutes := COALESCE(v_pro_duration, 30);
    source := 'professional';
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_clinic_days IS NOT NULL THEN
    working_days := v_clinic_days;
    default_duration_minutes := COALESCE(v_pro_duration, 30);
    source := 'clinic_opening_hours';
    RETURN NEXT;
    RETURN;
  END IF;

  -- final fallback: clinic_schedule_config
  RETURN QUERY
  SELECT
    jsonb_build_object(
      'seg', jsonb_build_object('enabled', true, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'ter', jsonb_build_object('enabled', true, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'qua', jsonb_build_object('enabled', true, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'qui', jsonb_build_object('enabled', true, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'sex', jsonb_build_object('enabled', true, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'sab', jsonb_build_object('enabled', false, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00'),
      'dom', jsonb_build_object('enabled', false, 'open', csc.start_time::text, 'close', csc.end_time::text, 'hasLunch', false, 'lunchStart','12:00','lunchEnd','13:00')
    ),
    COALESCE(csc.default_duration_minutes, 30),
    'clinic_schedule_config'::text
  FROM clinic_schedule_config csc
  WHERE csc.clinic_id = _clinic_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_effective_schedule(uuid, uuid) TO anon, authenticated;
