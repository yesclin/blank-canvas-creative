-- Create storage bucket for clinical documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-documents',
  'clinical-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the clinical-documents bucket
-- Users can view documents from their clinic
CREATE POLICY "Users can view clinical documents from their clinic"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinical-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Users can upload documents to their clinic folder
CREATE POLICY "Users can upload clinical documents to their clinic"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinical-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Users can delete documents from their clinic (owners/admins only via app logic)
CREATE POLICY "Users can delete clinical documents from their clinic"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinical-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM profiles WHERE id = auth.uid()
  )
);