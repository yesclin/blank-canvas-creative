
CREATE TABLE public.medication_api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  provider TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert logs"
  ON public.medication_api_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read own logs"
  ON public.medication_api_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_medication_api_logs_clinic ON public.medication_api_logs(clinic_id);
CREATE INDEX idx_medication_api_logs_created ON public.medication_api_logs(created_at DESC);
