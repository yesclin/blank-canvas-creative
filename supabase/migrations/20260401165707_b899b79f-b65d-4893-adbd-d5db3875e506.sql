
-- Add columns to clinics
ALTER TABLE public.clinics 
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_booking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_booking_settings jsonb NOT NULL DEFAULT '{}';

-- Add columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS created_source text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS booking_reference text,
  ADD COLUMN IF NOT EXISTS confirmation_token text;

-- Index for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_slug ON public.clinics(slug) WHERE slug IS NOT NULL;

-- Index for booking reference lookups
CREATE INDEX IF NOT EXISTS idx_appointments_booking_reference ON public.appointments(booking_reference) WHERE booking_reference IS NOT NULL;

-- ============================================================
-- RLS Policies for anonymous public booking access
-- ============================================================

-- Clinics: anon can see basic info of public-booking-enabled clinics
CREATE POLICY "Anon can view public booking clinics"
ON public.clinics
FOR SELECT
TO anon
USING (public_booking_enabled = true);

-- Specialties: anon can see active specialties of public clinics
CREATE POLICY "Anon can view specialties of public clinics"
ON public.specialties
FOR SELECT
TO anon
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = specialties.clinic_id 
    AND clinics.public_booking_enabled = true
  )
);

-- Professionals: anon can see active professionals of public clinics
CREATE POLICY "Anon can view professionals of public clinics"
ON public.professionals
FOR SELECT
TO anon
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = professionals.clinic_id 
    AND clinics.public_booking_enabled = true
  )
);

-- Professional specialties: anon can see links for public clinics
CREATE POLICY "Anon can view professional_specialties of public clinics"
ON public.professional_specialties
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    JOIN public.clinics c ON c.id = p.clinic_id
    WHERE p.id = professional_specialties.professional_id
    AND p.is_active = true
    AND c.public_booking_enabled = true
  )
);

-- Professional schedules: anon can see for availability calculation
CREATE POLICY "Anon can view professional_schedules of public clinics"
ON public.professional_schedules
FOR SELECT
TO anon
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    JOIN public.clinics c ON c.id = p.clinic_id
    WHERE p.id = professional_schedules.professional_id
    AND p.is_active = true
    AND c.public_booking_enabled = true
  )
);

-- Clinic schedule config: anon can read for public clinics
CREATE POLICY "Anon can view clinic_schedule_config of public clinics"
ON public.clinic_schedule_config
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = clinic_schedule_config.clinic_id
    AND clinics.public_booking_enabled = true
  )
);

-- Schedule blocks: anon can see blocks to exclude unavailable times
CREATE POLICY "Anon can view schedule_blocks of public clinics"
ON public.schedule_blocks
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = schedule_blocks.clinic_id
    AND clinics.public_booking_enabled = true
  )
);

-- Appointment types: anon can see active types for public clinics
CREATE POLICY "Anon can view appointment_types of public clinics"
ON public.appointment_types
FOR SELECT
TO anon
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointment_types.clinic_id
    AND clinics.public_booking_enabled = true
  )
);

-- Appointments: anon can only check for time conflicts (no patient data exposed)
-- We use a security definer function instead of direct SELECT to avoid leaking data

CREATE OR REPLACE FUNCTION public.check_slot_available(
  _clinic_id uuid,
  _professional_id uuid,
  _scheduled_date date,
  _start_time time,
  _end_time time
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE clinic_id = _clinic_id
    AND professional_id = _professional_id
    AND scheduled_date = _scheduled_date
    AND status NOT IN ('cancelado', 'faltou')
    AND start_time < _end_time
    AND end_time > _start_time
  )
$$;

-- Appointments: anon can insert public bookings
CREATE POLICY "Anon can create public bookings"
ON public.appointments
FOR INSERT
TO anon
WITH CHECK (
  created_source = 'public_patient'
  AND EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointments.clinic_id
    AND clinics.public_booking_enabled = true
  )
);

-- Patients: anon can find existing patients by clinic (security definer function)
CREATE OR REPLACE FUNCTION public.find_or_create_public_patient(
  _clinic_id uuid,
  _full_name text,
  _phone text,
  _email text DEFAULT NULL,
  _cpf text DEFAULT NULL,
  _birth_date date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _patient_id uuid;
BEGIN
  -- Try to find by CPF first
  IF _cpf IS NOT NULL AND _cpf != '' THEN
    SELECT id INTO _patient_id
    FROM public.patients
    WHERE clinic_id = _clinic_id AND cpf = _cpf AND is_active = true
    LIMIT 1;
  END IF;

  -- Try to find by phone
  IF _patient_id IS NULL AND _phone IS NOT NULL AND _phone != '' THEN
    SELECT id INTO _patient_id
    FROM public.patients
    WHERE clinic_id = _clinic_id AND phone = _phone AND is_active = true
    LIMIT 1;
  END IF;

  -- Create new patient if not found
  IF _patient_id IS NULL THEN
    INSERT INTO public.patients (clinic_id, full_name, phone, email, cpf, birth_date, is_active)
    VALUES (_clinic_id, _full_name, _phone, _email, _cpf, _birth_date, true)
    RETURNING id INTO _patient_id;
  END IF;

  RETURN _patient_id;
END;
$$;

-- Procedures: anon can see active procedures for public clinics
CREATE POLICY "Anon can view procedures of public clinics"
ON public.procedures
FOR SELECT
TO anon
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = procedures.clinic_id
    AND clinics.public_booking_enabled = true
  )
);

-- Function to get existing appointments for availability (returns only times, no patient info)
CREATE OR REPLACE FUNCTION public.get_booked_slots(
  _clinic_id uuid,
  _professional_id uuid,
  _date_start date,
  _date_end date
)
RETURNS TABLE(scheduled_date date, start_time time, end_time time)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.scheduled_date::date, a.start_time::time, a.end_time::time
  FROM public.appointments a
  WHERE a.clinic_id = _clinic_id
  AND a.professional_id = _professional_id
  AND a.scheduled_date >= _date_start
  AND a.scheduled_date <= _date_end
  AND a.status NOT IN ('cancelado', 'faltou')
$$;
