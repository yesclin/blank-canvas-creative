ALTER TABLE public.clinical_consent_acceptances
  ADD COLUMN IF NOT EXISTS procedure_id uuid NULL REFERENCES public.procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procedure_name text NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_consent_acceptances_procedure_id
  ON public.clinical_consent_acceptances(procedure_id);

CREATE INDEX IF NOT EXISTS idx_clinical_consent_acceptances_patient_clinic
  ON public.clinical_consent_acceptances(clinic_id, patient_id, accepted_at DESC);