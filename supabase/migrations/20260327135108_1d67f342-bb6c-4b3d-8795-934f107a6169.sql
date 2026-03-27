
-- Fix consent_terms: add parent_term_id for version chaining
ALTER TABLE public.consent_terms
  ADD COLUMN IF NOT EXISTS parent_term_id uuid REFERENCES public.consent_terms(id);

-- Fix system_security_settings: add missing LGPD columns
ALTER TABLE public.system_security_settings
  ADD COLUMN IF NOT EXISTS require_consent_on_registration boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_patient_data_deletion boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS anonymize_reports boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS log_retention_days integer DEFAULT 365;
