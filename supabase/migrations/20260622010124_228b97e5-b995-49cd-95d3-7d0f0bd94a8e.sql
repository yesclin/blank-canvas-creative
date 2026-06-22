CREATE OR REPLACE FUNCTION public.get_teleconsulta_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  token_row public.teleconsultation_access_tokens%ROWTYPE;
  session_row public.teleconsultation_sessions%ROWTYPE;
  appointment_row public.appointments%ROWTYPE;
  token_status text := 'valid';
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT *
    INTO token_row
  FROM public.teleconsultation_access_tokens tat
  WHERE tat.token = trim(p_token)
    AND tat.target_actor = 'patient'
    AND tat.token_type IN ('precheck', 'sala')
  ORDER BY tat.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF token_row.revoked_at IS NOT NULL THEN
      token_status := 'revoked';
    ELSIF token_row.expires_at <= now() THEN
      token_status := 'expired';
    END IF;

    SELECT *
      INTO appointment_row
    FROM public.appointments a
    WHERE a.id = token_row.appointment_id
      AND a.care_mode = 'teleconsulta'
    LIMIT 1;

    SELECT *
      INTO session_row
    FROM public.teleconsultation_sessions ts
    WHERE ts.id = token_row.teleconsultation_session_id
       OR ts.appointment_id = token_row.appointment_id
    ORDER BY ts.created_at DESC
    LIMIT 1;
  ELSE
    SELECT *
      INTO session_row
    FROM public.teleconsultation_sessions ts
    WHERE ts.external_meeting_id = trim(p_token)
       OR ts.access_token_patient = trim(p_token)
    ORDER BY ts.created_at DESC
    LIMIT 1;

    IF FOUND THEN
      SELECT *
        INTO appointment_row
      FROM public.appointments a
      WHERE a.id = session_row.appointment_id
        AND a.care_mode = 'teleconsulta'
      LIMIT 1;
    ELSE
      SELECT *
        INTO appointment_row
      FROM public.appointments a
      WHERE a.meeting_id = trim(p_token)
        AND a.care_mode = 'teleconsulta'
      LIMIT 1;

      IF FOUND THEN
        SELECT *
          INTO session_row
        FROM public.teleconsultation_sessions ts
        WHERE ts.appointment_id = appointment_row.id
        ORDER BY ts.created_at DESC
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  IF appointment_row.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', appointment_row.id,
    'clinic_id', appointment_row.clinic_id,
    'patient_id', appointment_row.patient_id,
    'teleconsultation_session_id', session_row.id,
    'token_status', token_status,
    'token_expires_at', token_row.expires_at,
    'scheduled_date', appointment_row.scheduled_date,
    'start_time', appointment_row.start_time,
    'end_time', appointment_row.end_time,
    'meeting_link', appointment_row.meeting_link,
    'meeting_status', appointment_row.meeting_status,
    'care_mode', appointment_row.care_mode,
    'precheck_status', appointment_row.precheck_status,
    'consent_telehealth_required', appointment_row.consent_telehealth_required,
    'consent_telehealth_accepted', appointment_row.consent_telehealth_accepted,
    'session', CASE WHEN session_row.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', session_row.id,
      'status', session_row.status,
      'join_url_patient', session_row.join_url_patient
    ) END,
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
  WHERE a.id = appointment_row.id;

  RETURN result;
END;
$$;

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
  appointment_id uuid;
  clinic_id uuid;
  session_id uuid;
BEGIN
  info := public.get_teleconsulta_by_token(p_token);
  IF info IS NULL THEN
    RETURN false;
  END IF;

  token_status := COALESCE(info->>'token_status', 'valid');
  IF token_status <> 'valid' THEN
    RETURN false;
  END IF;

  appointment_id := (info->>'id')::uuid;
  clinic_id := (info->>'clinic_id')::uuid;
  session_id := NULLIF(info->>'teleconsultation_session_id', '')::uuid;

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
    clinic_id,
    COALESCE(session_id, ts.id),
    a.id,
    a.patient_id,
    a.professional_id,
    p_event_type,
    'patient',
    COALESCE(p_payload, '{}'::jsonb)
  FROM public.appointments a
  LEFT JOIN public.teleconsultation_sessions ts ON ts.appointment_id = a.id
  WHERE a.id = appointment_id
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

CREATE OR REPLACE FUNCTION public.start_teleconsulta_precheck_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  info jsonb;
  token_status text;
  appointment_id uuid;
  clinic_id uuid;
BEGIN
  info := public.get_teleconsulta_by_token(p_token);
  IF info IS NULL THEN
    RETURN false;
  END IF;

  token_status := COALESCE(info->>'token_status', 'valid');
  IF token_status <> 'valid' THEN
    RETURN false;
  END IF;

  appointment_id := (info->>'id')::uuid;
  clinic_id := (info->>'clinic_id')::uuid;

  UPDATE public.appointments
     SET precheck_status = CASE WHEN precheck_status = 'concluido' THEN precheck_status ELSE 'em_progresso' END,
         updated_at = now()
   WHERE id = appointment_id
     AND care_mode = 'teleconsulta';

  PERFORM public.log_teleconsulta_event_by_token(p_token, 'precheck_iniciado', '{}'::jsonb);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_teleconsulta_precheck_by_token(
  p_token text,
  p_identification_confirmed boolean,
  p_consent_accepted boolean,
  p_camera_ok boolean,
  p_microphone_ok boolean,
  p_connection_ok boolean,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  info jsonb;
  token_status text;
  appointment_id uuid;
  clinic_id uuid;
  patient_id uuid;
  session_id uuid;
BEGIN
  info := public.get_teleconsulta_by_token(p_token);
  IF info IS NULL THEN
    RETURN false;
  END IF;

  token_status := COALESCE(info->>'token_status', 'valid');
  IF token_status <> 'valid' THEN
    RETURN false;
  END IF;

  appointment_id := (info->>'id')::uuid;
  clinic_id := (info->>'clinic_id')::uuid;
  patient_id := (info->>'patient_id')::uuid;
  session_id := NULLIF(info->>'teleconsultation_session_id', '')::uuid;

  INSERT INTO public.teleconsultation_prechecks (
    clinic_id,
    appointment_id,
    teleconsultation_session_id,
    patient_id,
    status,
    identification_method,
    identification_confirmed,
    identification_confirmed_at,
    consent_required,
    consent_accepted,
    consent_accepted_at,
    camera_test_status,
    microphone_test_status,
    connection_test_status,
    technical_notes,
    started_at,
    completed_at,
    released_to_join,
    release_reason
  ) VALUES (
    clinic_id,
    appointment_id,
    session_id,
    patient_id,
    CASE WHEN p_identification_confirmed AND p_consent_accepted AND p_camera_ok AND p_microphone_ok AND p_connection_ok THEN 'concluido' ELSE 'parcialmente_concluido' END,
    'birth_date',
    COALESCE(p_identification_confirmed, false),
    CASE WHEN p_identification_confirmed THEN now() ELSE NULL END,
    true,
    COALESCE(p_consent_accepted, false),
    CASE WHEN p_consent_accepted THEN now() ELSE NULL END,
    CASE WHEN p_camera_ok THEN 'ok' ELSE 'falhou' END,
    CASE WHEN p_microphone_ok THEN 'ok' ELSE 'falhou' END,
    CASE WHEN p_connection_ok THEN 'ok' ELSE 'falhou' END,
    p_notes,
    now(),
    now(),
    COALESCE(p_identification_confirmed, false) AND COALESCE(p_consent_accepted, false),
    CASE WHEN COALESCE(p_identification_confirmed, false) AND COALESCE(p_consent_accepted, false) THEN 'precheck_concluido' ELSE 'precheck_parcial' END
  )
  ON CONFLICT (appointment_id) DO UPDATE SET
    teleconsultation_session_id = EXCLUDED.teleconsultation_session_id,
    status = EXCLUDED.status,
    identification_method = EXCLUDED.identification_method,
    identification_confirmed = EXCLUDED.identification_confirmed,
    identification_confirmed_at = EXCLUDED.identification_confirmed_at,
    consent_required = EXCLUDED.consent_required,
    consent_accepted = EXCLUDED.consent_accepted,
    consent_accepted_at = EXCLUDED.consent_accepted_at,
    camera_test_status = EXCLUDED.camera_test_status,
    microphone_test_status = EXCLUDED.microphone_test_status,
    connection_test_status = EXCLUDED.connection_test_status,
    technical_notes = EXCLUDED.technical_notes,
    completed_at = EXCLUDED.completed_at,
    released_to_join = EXCLUDED.released_to_join,
    release_reason = EXCLUDED.release_reason,
    updated_at = now();

  UPDATE public.appointments
     SET precheck_status = 'concluido',
         consent_telehealth_accepted = COALESCE(p_consent_accepted, false),
         consent_telehealth_accepted_at = CASE WHEN p_consent_accepted THEN now() ELSE NULL END,
         updated_at = now()
   WHERE id = appointment_id
     AND care_mode = 'teleconsulta';

  UPDATE public.teleconsultation_access_tokens
     SET last_used_at = now(),
         first_used_at = COALESCE(first_used_at, now())
   WHERE token = trim(p_token)
     AND target_actor = 'patient'
     AND revoked_at IS NULL
     AND expires_at > now();

  PERFORM public.log_teleconsulta_event_by_token(p_token, 'precheck_concluido', jsonb_build_object(
    'identification_confirmed', COALESCE(p_identification_confirmed, false),
    'consent_accepted', COALESCE(p_consent_accepted, false),
    'camera_ok', COALESCE(p_camera_ok, false),
    'microphone_ok', COALESCE(p_microphone_ok, false),
    'connection_ok', COALESCE(p_connection_ok, false)
  ));

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teleconsulta_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_teleconsulta_event_by_token(text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_teleconsulta_precheck_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_teleconsulta_precheck_by_token(text, boolean, boolean, boolean, boolean, boolean, text) TO anon, authenticated;