
-- 1. Create document action history table
CREATE TABLE IF NOT EXISTS public.clinical_attendance_document_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.clinical_attendance_documents(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'generated', 'printed', 'pdf_exported', 'signed', 'note_added', 'addendum_added'
  performed_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.clinical_attendance_document_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for history
CREATE POLICY "Users can view history for their clinic docs"
ON public.clinical_attendance_document_history
FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert history for their clinic docs"
ON public.clinical_attendance_document_history
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM public.professionals WHERE user_id = auth.uid()
  )
);

-- 4. Trigger to block snapshot_json updates when document is locked
CREATE OR REPLACE FUNCTION public.block_locked_snapshot_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the document is already locked and snapshot_json is being changed, block it
  IF OLD.is_locked = true AND NEW.snapshot_json IS DISTINCT FROM OLD.snapshot_json THEN
    RAISE EXCEPTION 'Cannot modify snapshot_json on a locked document (id: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_locked_snapshot ON public.clinical_attendance_documents;
CREATE TRIGGER trg_block_locked_snapshot
BEFORE UPDATE ON public.clinical_attendance_documents
FOR EACH ROW
EXECUTE FUNCTION public.block_locked_snapshot_update();

-- 5. Index for fast history lookups
CREATE INDEX IF NOT EXISTS idx_doc_history_document_id ON public.clinical_attendance_document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_history_clinic_id ON public.clinical_attendance_document_history(clinic_id);
