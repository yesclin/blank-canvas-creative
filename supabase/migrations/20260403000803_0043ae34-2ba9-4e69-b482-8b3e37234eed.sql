
-- Table for patient pre-registration links
CREATE TABLE public.patient_pre_registration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NULL REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id uuid NULL REFERENCES public.appointments(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  full_name text NULL,
  phone text NULL,
  email text NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz NULL,
  submitted_data jsonb NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pre_reg_links_clinic_status ON public.patient_pre_registration_links(clinic_id, status);
CREATE INDEX idx_pre_reg_links_appointment ON public.patient_pre_registration_links(appointment_id);
CREATE INDEX idx_pre_reg_links_patient ON public.patient_pre_registration_links(patient_id);

-- Updated_at trigger
CREATE TRIGGER update_pre_reg_links_updated_at
  BEFORE UPDATE ON public.patient_pre_registration_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.patient_pre_registration_links ENABLE ROW LEVEL SECURITY;

-- Authenticated users: access own clinic's records
CREATE POLICY "Clinic members can view own pre-reg links"
  ON public.patient_pre_registration_links
  FOR SELECT TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can create pre-reg links"
  ON public.patient_pre_registration_links
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can update own pre-reg links"
  ON public.patient_pre_registration_links
  FOR UPDATE TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinic members can delete own pre-reg links"
  ON public.patient_pre_registration_links
  FOR DELETE TO authenticated
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Security definer function for public token lookup
CREATE OR REPLACE FUNCTION public.get_pre_registration_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
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
  )
  INTO result
  FROM public.patient_pre_registration_links l
  JOIN public.clinics c ON c.id = l.clinic_id
  WHERE l.token = _token;

  RETURN result;
END;
$$;

-- Security definer function for public form submission
CREATE OR REPLACE FUNCTION public.submit_pre_registration(
  _token text,
  _data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_record record;
  patient_result uuid;
  result jsonb;
BEGIN
  -- Get and validate link
  SELECT * INTO link_record
  FROM public.patient_pre_registration_links
  WHERE token = _token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link não encontrado');
  END IF;

  IF link_record.status IN ('submitted', 'canceled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este link já foi utilizado ou cancelado');
  END IF;

  IF link_record.expires_at < now() THEN
    UPDATE public.patient_pre_registration_links SET status = 'expired' WHERE id = link_record.id;
    RETURN jsonb_build_object('success', false, 'error', 'Este link expirou');
  END IF;

  -- If patient_id exists, update patient
  IF link_record.patient_id IS NOT NULL THEN
    UPDATE public.patients SET
      full_name = COALESCE(_data->>'full_name', full_name),
      phone = COALESCE(_data->>'phone', phone),
      email = COALESCE(NULLIF(_data->>'email', ''), email),
      cpf = COALESCE(NULLIF(_data->>'cpf', ''), cpf),
      birth_date = COALESCE(NULLIF(_data->>'birth_date', ''), birth_date),
      gender = COALESCE(NULLIF(_data->>'gender', ''), gender),
      address_zip = COALESCE(NULLIF(_data->>'address_zip', ''), address_zip),
      address_street = COALESCE(NULLIF(_data->>'address_street', ''), address_street),
      address_number = COALESCE(NULLIF(_data->>'address_number', ''), address_number),
      address_complement = COALESCE(NULLIF(_data->>'address_complement', ''), address_complement),
      address_neighborhood = COALESCE(NULLIF(_data->>'address_neighborhood', ''), address_neighborhood),
      address_city = COALESCE(NULLIF(_data->>'address_city', ''), address_city),
      address_state = COALESCE(NULLIF(_data->>'address_state', ''), address_state),
      notes = COALESCE(NULLIF(_data->>'notes', ''), notes),
      updated_at = now()
    WHERE id = link_record.patient_id;
    patient_result := link_record.patient_id;
  ELSE
    -- Create new patient
    INSERT INTO public.patients (
      clinic_id, full_name, phone, email, cpf, birth_date, gender,
      address_zip, address_street, address_number, address_complement,
      address_neighborhood, address_city, address_state, notes
    ) VALUES (
      link_record.clinic_id,
      _data->>'full_name',
      _data->>'phone',
      NULLIF(_data->>'email', ''),
      NULLIF(_data->>'cpf', ''),
      NULLIF(_data->>'birth_date', ''),
      NULLIF(_data->>'gender', ''),
      NULLIF(_data->>'address_zip', ''),
      NULLIF(_data->>'address_street', ''),
      NULLIF(_data->>'address_number', ''),
      NULLIF(_data->>'address_complement', ''),
      NULLIF(_data->>'address_neighborhood', ''),
      NULLIF(_data->>'address_city', ''),
      NULLIF(_data->>'address_state', ''),
      NULLIF(_data->>'notes', '')
    )
    RETURNING id INTO patient_result;
  END IF;

  -- Update the link
  UPDATE public.patient_pre_registration_links SET
    status = 'submitted',
    submitted_at = now(),
    submitted_data = _data,
    patient_id = patient_result,
    full_name = _data->>'full_name',
    phone = _data->>'phone',
    email = NULLIF(_data->>'email', '')
  WHERE id = link_record.id;

  -- If there's an appointment, link patient
  IF link_record.appointment_id IS NOT NULL AND patient_result IS NOT NULL THEN
    UPDATE public.appointments SET
      patient_id = patient_result
    WHERE id = link_record.appointment_id
      AND patient_id IS NULL;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'patient_id', patient_result
  );
END;
$$;
