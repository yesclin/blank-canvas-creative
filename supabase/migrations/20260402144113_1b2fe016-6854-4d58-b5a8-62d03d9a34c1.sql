
ALTER TABLE public.crm_followups
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_by uuid;

CREATE INDEX IF NOT EXISTS idx_crm_followups_patient_id ON public.crm_followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_crm_followups_scheduled_at ON public.crm_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_followups_status ON public.crm_followups(status);
