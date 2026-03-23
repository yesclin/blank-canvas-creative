
-- Add revoked_reason column to clinical_documents
ALTER TABLE public.clinical_documents 
ADD COLUMN IF NOT EXISTS revoked_reason text;
