
-- Add teleconsulta columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS care_mode text NOT NULL DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS meeting_provider text,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS meeting_id text,
  ADD COLUMN IF NOT EXISTS meeting_password text,
  ADD COLUMN IF NOT EXISTS meeting_status text NOT NULL DEFAULT 'nao_gerada',
  ADD COLUMN IF NOT EXISTS meeting_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS precheck_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS consent_telehealth_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_telehealth_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS technical_issue_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS teleconsultation_notes text;

-- Create teleconsultation_sessions table
CREATE TABLE IF NOT EXISTS public.teleconsultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  provider text NOT NULL DEFAULT 'manual',
  external_meeting_id text,
  join_url_patient text,
  join_url_professional text,
  host_url text,
  status text NOT NULL DEFAULT 'criada',
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  recording_status text,
  connection_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teleconsultation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage teleconsultation sessions in their clinic"
  ON public.teleconsultation_sessions
  FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create teleconsultation_events table
CREATE TABLE IF NOT EXISTS public.teleconsultation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  teleconsultation_session_id uuid NOT NULL REFERENCES public.teleconsultation_sessions(id),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  event_type text NOT NULL,
  actor_type text NOT NULL DEFAULT 'system',
  actor_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teleconsultation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage teleconsultation events in their clinic"
  ON public.teleconsultation_events
  FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create teleconsultation_prechecks table
CREATE TABLE IF NOT EXISTS public.teleconsultation_prechecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  camera_ok boolean DEFAULT false,
  microphone_ok boolean DEFAULT false,
  internet_ok boolean DEFAULT false,
  identity_confirmed boolean DEFAULT false,
  consent_accepted boolean DEFAULT false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teleconsultation_prechecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage teleconsultation prechecks in their clinic"
  ON public.teleconsultation_prechecks
  FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));

-- Create teleconsultation_settings table
CREATE TABLE IF NOT EXISTS public.teleconsultation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) UNIQUE,
  enabled boolean DEFAULT false,
  default_provider text DEFAULT 'manual',
  require_consent boolean DEFAULT true,
  require_precheck boolean DEFAULT true,
  late_tolerance_minutes integer DEFAULT 15,
  allow_recording boolean DEFAULT false,
  link_send_channels jsonb DEFAULT '["whatsapp","email"]'::jsonb,
  enabled_specialty_ids uuid[] DEFAULT '{}',
  enabled_procedure_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.teleconsultation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage teleconsultation settings in their clinic"
  ON public.teleconsultation_settings
  FOR ALL
  TO authenticated
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()));
