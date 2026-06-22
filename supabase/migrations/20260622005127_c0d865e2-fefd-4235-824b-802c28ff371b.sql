CREATE OR REPLACE FUNCTION public.get_teleconsulta_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', a.id,
    'clinic_id', a.clinic_id,
    'patient_id', a.patient_id,
    'scheduled_date', a.scheduled_date,
    'start_time', a.start_time,
    'end_time', a.end_time,
    'meeting_link', a.meeting_link,
    'meeting_status', a.meeting_status,
    'care_mode', a.care_mode,
    'precheck_status', a.precheck_status,
    'patients', jsonb_build_object(
      'full_name', p.full_name,
      'birth_date', p.birth_date
    ),
    'professionals', jsonb_build_object(
      'full_name', pr.full_name
    ),
    'specialties', jsonb_build_object(
      'name', s.name
    ),
    'clinics', jsonb_build_object(
      'name', c.name,
      'logo_url', c.logo_url
    )
  )
  INTO result
  FROM public.appointments a
  LEFT JOIN public.patients p ON p.id = a.patient_id
  LEFT JOIN public.professionals pr ON pr.id = a.professional_id
  LEFT JOIN public.specialties s ON s.id = a.specialty_id
  LEFT JOIN public.clinics c ON c.id = a.clinic_id
  WHERE a.meeting_id = p_token
    AND a.care_mode = 'teleconsulta'
  LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teleconsulta_by_token(text) TO anon, authenticated;