
-- Create clinical_attendance_documents table
CREATE TABLE public.clinical_attendance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id),
  procedure_id UUID REFERENCES public.procedures(id),
  document_type TEXT NOT NULL DEFAULT 'attendance_summary',
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'signed', 'cancelled')),
  snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  render_version INTEGER NOT NULL DEFAULT 1,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  locked_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by UUID,
  signature_metadata JSONB,
  is_locked BOOLEAN NOT NULL DEFAULT true,
  hash_sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one document per appointment
CREATE UNIQUE INDEX idx_attendance_doc_appointment ON public.clinical_attendance_documents(appointment_id);

-- Index for clinic lookups
CREATE INDEX idx_attendance_doc_clinic ON public.clinical_attendance_documents(clinic_id);
CREATE INDEX idx_attendance_doc_patient ON public.clinical_attendance_documents(clinic_id, patient_id);

-- Enable RLS
ALTER TABLE public.clinical_attendance_documents ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users from same clinic can view (excluding receptionist via app-level check)
CREATE POLICY "Users can view attendance documents from their clinic"
ON public.clinical_attendance_documents
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- RLS: Only professionals can insert their own documents
CREATE POLICY "Professionals can create attendance documents"
ON public.clinical_attendance_documents
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- RLS: Allow update only for signing (no delete allowed)
CREATE POLICY "Professionals can update attendance documents for signing"
ON public.clinical_attendance_documents
FOR UPDATE
TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- No DELETE policy = documents cannot be deleted

-- Create notes/addendums table
CREATE TABLE public.clinical_attendance_document_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_attendance_documents(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'nota' CHECK (note_type IN ('nota', 'adendo')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_doc_notes_doc ON public.clinical_attendance_document_notes(document_id);

ALTER TABLE public.clinical_attendance_document_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes from their clinic"
ON public.clinical_attendance_document_notes
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can add notes"
ON public.clinical_attendance_document_notes
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT p.clinic_id FROM public.professionals p WHERE p.user_id = auth.uid()
  )
);

-- Trigger to protect locked documents from content changes
CREATE OR REPLACE FUNCTION public.protect_attendance_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Allow signing updates
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    NEW.status := 'signed';
    RETURN NEW;
  END IF;
  
  -- Allow pdf_url update
  IF NEW.pdf_url IS DISTINCT FROM OLD.pdf_url AND 
     NEW.snapshot_json = OLD.snapshot_json THEN
    RETURN NEW;
  END IF;

  -- Block snapshot changes on locked documents
  IF OLD.is_locked = true AND NEW.snapshot_json IS DISTINCT FROM OLD.snapshot_json THEN
    RAISE EXCEPTION 'Cannot modify snapshot of locked attendance document';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_attendance_document
BEFORE UPDATE ON public.clinical_attendance_documents
FOR EACH ROW
EXECUTE FUNCTION public.protect_attendance_document();

-- Updated_at trigger
CREATE TRIGGER update_attendance_doc_updated_at
BEFORE UPDATE ON public.clinical_attendance_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
