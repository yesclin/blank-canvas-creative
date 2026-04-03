
CREATE TABLE public.appointment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  pause_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  session_summary JSONB DEFAULT NULL,
  session_notes TEXT DEFAULT NULL,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  current_pause_started_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

ALTER TABLE public.appointment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions from their clinic"
  ON public.appointment_sessions FOR SELECT
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can create sessions in their clinic"
  ON public.appointment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id = user_clinic_id(auth.uid()));

CREATE POLICY "Users can update sessions in their clinic"
  ON public.appointment_sessions FOR UPDATE
  TO authenticated
  USING (clinic_id = user_clinic_id(auth.uid()));

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ DEFAULT NULL;

CREATE TRIGGER update_appointment_sessions_updated_at
  BEFORE UPDATE ON public.appointment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
