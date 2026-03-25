
-- ============================================================
-- ETAPA 4: System Security Settings + Patient Consents enhancements
-- + Validation code auto-generation for clinical documents
-- ============================================================

-- 1. System Security Settings (for LGPD enforcement config)
CREATE TABLE IF NOT EXISTS public.system_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  enforce_consent_before_care BOOLEAN NOT NULL DEFAULT false,
  lock_record_without_consent BOOLEAN NOT NULL DEFAULT false,
  enable_digital_signature BOOLEAN NOT NULL DEFAULT true,
  enable_access_logging BOOLEAN NOT NULL DEFAULT true,
  enable_tab_permissions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id)
);

ALTER TABLE public.system_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security settings"
  ON public.system_security_settings FOR ALL
  USING (is_clinic_admin(auth.uid(), clinic_id));

CREATE POLICY "Users can view security settings"
  ON public.system_security_settings FOR SELECT
  USING (clinic_id = user_clinic_id(auth.uid()));

-- 2. Add missing columns to patient_consents
ALTER TABLE public.patient_consents
  ADD COLUMN IF NOT EXISTS granted_by UUID,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS term_version INTEGER;

-- 3. Auto-generate validation_code for clinical_documents
CREATE OR REPLACE FUNCTION public.generate_validation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.validation_code IS NULL AND NEW.status = 'assinado' THEN
    NEW.validation_code := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_validation_code ON public.clinical_documents;
CREATE TRIGGER trg_generate_validation_code
  BEFORE INSERT OR UPDATE ON public.clinical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_validation_code();

-- 4. Auto-generate validation_code for clinical_evolutions when signed
CREATE OR REPLACE FUNCTION public.generate_evolution_validation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'assinado' AND OLD.status != 'assinado' THEN
    NEW.signed_at := COALESCE(NEW.signed_at, now());
    NEW.signed_by := COALESCE(NEW.signed_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_evolution_sign ON public.clinical_evolutions;
CREATE TRIGGER trg_evolution_sign
  BEFORE UPDATE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_evolution_validation_code();

-- 5. updated_at trigger for system_security_settings
CREATE TRIGGER set_updated_at_system_security_settings
  BEFORE UPDATE ON public.system_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Index for patient_consents lookups
CREATE INDEX IF NOT EXISTS idx_patient_consents_lookup 
  ON public.patient_consents(clinic_id, patient_id, term_id);

-- 7. Index for validation_code lookups
CREATE INDEX IF NOT EXISTS idx_clinical_documents_validation_code
  ON public.clinical_documents(validation_code) WHERE validation_code IS NOT NULL;
