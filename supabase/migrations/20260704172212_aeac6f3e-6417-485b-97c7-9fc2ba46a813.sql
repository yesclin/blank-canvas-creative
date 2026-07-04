
ALTER TABLE public.clinic_resources
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS effective_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_clinic_resources_expires
  ON public.clinic_resources (clinic_id, expires_at)
  WHERE expires_at IS NOT NULL;
