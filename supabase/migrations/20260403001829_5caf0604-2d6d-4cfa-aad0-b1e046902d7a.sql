
CREATE OR REPLACE FUNCTION public.get_pre_registration_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  _patient_id uuid;
  _patient jsonb;
  _insurance jsonb;
  _guardian jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', l.id,
    'clinic_id', l.clinic_id,
    'patient_id', l.patient_id,
    'appointment_id', l.appointment_id,
    'token', l.token,
    'full_name', l.full_name,
    'phone', l.phone,
    'email', l.email,
    'status', l.status,
    'expires_at', l.expires_at,
    'submitted_at', l.submitted_at,
    'clinic_name', c.name,
    'clinic_logo', c.logo_url
  ), l.patient_id
  INTO result, _patient_id
  FROM public.patient_pre_registration_links l
  JOIN public.clinics c ON c.id = l.clinic_id
  WHERE l.token = _token;

  IF result IS NULL THEN
    RETURN NULL;
  END IF;

  -- If there's a linked patient, fetch their full data
  IF _patient_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'full_name', p.full_name,
      'birth_date', p.birth_date,
      'cpf', p.cpf,
      'gender', p.gender,
      'phone', p.phone,
      'email', p.email,
      'address_street', p.address_street,
      'address_number', p.address_number,
      'address_complement', p.address_complement,
      'address_neighborhood', p.address_neighborhood,
      'address_city', p.address_city,
      'address_state', p.address_state,
      'address_zip', p.address_zip,
      'notes', p.notes
    )
    INTO _patient
    FROM public.patients p
    WHERE p.id = _patient_id;

    result := result || jsonb_build_object('patient_data', _patient);

    -- Fetch primary insurance
    SELECT jsonb_build_object(
      'insurance_name', ins.name,
      'card_number', pi.card_number
    )
    INTO _insurance
    FROM public.patient_insurances pi
    JOIN public.insurances ins ON ins.id = pi.insurance_id
    WHERE pi.patient_id = _patient_id AND pi.is_primary = true AND pi.is_active = true
    LIMIT 1;

    IF _insurance IS NOT NULL THEN
      result := result || jsonb_build_object('insurance_data', _insurance);
    END IF;

    -- Fetch primary guardian
    SELECT jsonb_build_object(
      'guardian_name', pg.full_name,
      'guardian_cpf', pg.cpf,
      'guardian_phone', pg.phone,
      'guardian_relationship', pg.relationship
    )
    INTO _guardian
    FROM public.patient_guardians pg
    WHERE pg.patient_id = _patient_id AND pg.is_primary = true
    LIMIT 1;

    IF _guardian IS NOT NULL THEN
      result := result || jsonb_build_object('guardian_data', _guardian);
    END IF;
  END IF;

  RETURN result;
END;
$$;
