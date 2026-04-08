
-- =============================================
-- 1. Clinical Addendums table
-- =============================================
CREATE TABLE public.clinical_addendums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'anamnesis', 'evolution', 'document', etc.
  record_id UUID NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  content TEXT NOT NULL,
  reason TEXT,
  module_origin TEXT, -- 'anamnese', 'evolucao', 'avaliacao', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addendums_record ON public.clinical_addendums(record_type, record_id);
CREATE INDEX idx_addendums_patient ON public.clinical_addendums(patient_id);
CREATE INDEX idx_addendums_clinic ON public.clinical_addendums(clinic_id);

ALTER TABLE public.clinical_addendums ENABLE ROW LEVEL SECURITY;

-- Professionals in same clinic can view
CREATE POLICY "Clinic professionals can view addendums"
ON public.clinical_addendums FOR SELECT TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

-- Professionals can create addendums
CREATE POLICY "Professionals can create addendums"
ON public.clinical_addendums FOR INSERT TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

-- No UPDATE or DELETE allowed (immutable)

-- =============================================
-- 2. Add config columns to security config
-- =============================================
ALTER TABLE public.medical_record_security_config
  ADD COLUMN IF NOT EXISTS require_justification_for_addendum BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_blocks_immediately BOOLEAN NOT NULL DEFAULT true;

-- =============================================
-- 3. DB-level trigger to block edits outside window
-- =============================================
CREATE OR REPLACE FUNCTION public.check_clinical_record_edit_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinic_id UUID;
  _edit_minutes INT;
  _lock_after_sig BOOLEAN;
  _sig_blocks_immediately BOOLEAN;
  _is_signed BOOLEAN;
  _created TIMESTAMPTZ;
  _editable_until TIMESTAMPTZ;
BEGIN
  -- Determine clinic_id from the record
  _clinic_id := NEW.clinic_id;
  _created := OLD.created_at;

  -- Check if record is signed
  SELECT EXISTS (
    SELECT 1 FROM public.medical_record_signatures
    WHERE record_id = OLD.id
  ) INTO _is_signed;

  -- Get config
  SELECT
    COALESCE(allow_evolution_edit_minutes, 60),
    COALESCE(lock_after_signature, true),
    COALESCE(signature_blocks_immediately, true)
  INTO _edit_minutes, _lock_after_sig, _sig_blocks_immediately
  FROM public.medical_record_security_config
  WHERE clinic_id = _clinic_id
  LIMIT 1;

  -- Default if no config
  IF _edit_minutes IS NULL THEN
    _edit_minutes := 60;
    _lock_after_sig := true;
    _sig_blocks_immediately := true;
  END IF;

  -- Rule 1: Signed + signature blocks immediately → block
  IF _is_signed AND (_lock_after_sig OR _sig_blocks_immediately) THEN
    RAISE EXCEPTION 'RECORD_LOCKED_SIGNED: Este registro está assinado e não pode ser alterado.';
  END IF;

  -- Rule 2: Check time window
  _editable_until := _created + (_edit_minutes * INTERVAL '1 minute');
  IF now() > _editable_until THEN
    RAISE EXCEPTION 'RECORD_LOCKED_TIME: Este registro está fora da janela de edição (% minutos). Utilize adendo para complementos.', _edit_minutes;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to clinical_evolutions
DROP TRIGGER IF EXISTS trg_check_evolution_edit_window ON public.clinical_evolutions;
CREATE TRIGGER trg_check_evolution_edit_window
  BEFORE UPDATE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_clinical_record_edit_window();

-- Apply trigger to anamnesis_records
DROP TRIGGER IF EXISTS trg_check_anamnesis_edit_window ON public.anamnesis_records;
CREATE TRIGGER trg_check_anamnesis_edit_window
  BEFORE UPDATE ON public.anamnesis_records
  FOR EACH ROW
  EXECUTE FUNCTION public.check_clinical_record_edit_window();

-- Apply trigger to clinical_documents
DROP TRIGGER IF EXISTS trg_check_document_edit_window ON public.clinical_documents;
CREATE TRIGGER trg_check_document_edit_window
  BEFORE UPDATE ON public.clinical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.check_clinical_record_edit_window();

-- =============================================
-- 4. Prevent DELETE on clinical records
-- =============================================
CREATE OR REPLACE FUNCTION public.prevent_clinical_record_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'RECORD_DELETE_BLOCKED: Registros clínicos não podem ser excluídos.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_evolution_delete ON public.clinical_evolutions;
CREATE TRIGGER trg_prevent_evolution_delete
  BEFORE DELETE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_clinical_record_delete();

DROP TRIGGER IF EXISTS trg_prevent_anamnesis_delete ON public.anamnesis_records;
CREATE TRIGGER trg_prevent_anamnesis_delete
  BEFORE DELETE ON public.anamnesis_records
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_clinical_record_delete();

DROP TRIGGER IF EXISTS trg_prevent_document_delete ON public.clinical_documents;
CREATE TRIGGER trg_prevent_document_delete
  BEFORE DELETE ON public.clinical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_clinical_record_delete();
