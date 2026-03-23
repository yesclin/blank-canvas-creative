
-- Add replacement tracking columns to clinical_documents
ALTER TABLE public.clinical_documents 
ADD COLUMN IF NOT EXISTS replaces_document_id uuid REFERENCES public.clinical_documents(id),
ADD COLUMN IF NOT EXISTS replaced_by_document_id uuid REFERENCES public.clinical_documents(id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_clinical_documents_replaces ON public.clinical_documents(replaces_document_id) WHERE replaces_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_documents_replaced_by ON public.clinical_documents(replaced_by_document_id) WHERE replaced_by_document_id IS NOT NULL;
