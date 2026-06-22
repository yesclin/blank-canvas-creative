CREATE OR REPLACE FUNCTION public.log_teleconsulta_event_by_token(
  p_token text,
  p_event_type text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  info jsonb;
  token_status text;
  v_appointment_id uuid;
  v_clinic_id uuid;
  v_session_id uuid;
BEGIN
  info := public.get_teleconsulta_by_token(p_token);
  IF info IS NULL THEN
    RETURN false;
  END IF;

  token_status := COALESCE(info->>'token_status', 'valid');
  IF token_status <> 'valid' THEN
    RETURN false;
  END IF;

  v_appointment_id := (info->>'id')::uuid;
  v_clinic_id := (info->>'clinic_id')::uuid;
  v_session_id := NULLIF(info->>'teleconsultation_session_id', '')::uuid;

  INSERT INTO public.teleconsultation_events (
    clinic_id,
    teleconsultation_session_id,
    appointment_id,
    patient_id,
    professional_id,
    event_type,
    actor_type,
    payload
  )
  SELECT
    v_clinic_id,
    COALESCE(v_session_id, ts.id),
    a.id,
    a.patient_id,
    a.professional_id,
    p_event_type,
    'patient',
    COALESCE(p_payload, '{}'::jsonb)
  FROM public.appointments a
  LEFT JOIN public.teleconsultation_sessions ts ON ts.appointment_id = a.id
  WHERE a.id = v_appointment_id
  ORDER BY ts.created_at DESC
  LIMIT 1;

  UPDATE public.teleconsultation_access_tokens
     SET last_used_at = now(),
         first_used_at = COALESCE(first_used_at, now())
   WHERE token = trim(p_token)
     AND target_actor = 'patient'
     AND revoked_at IS NULL
     AND expires_at > now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_teleconsulta_event_by_token(text, text, jsonb) TO anon, authenticated;