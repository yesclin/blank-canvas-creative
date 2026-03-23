
-- Make anamnesis-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'anamnesis-images';

-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view anamnesis images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view anamnesis images" ON storage.objects;
DROP POLICY IF EXISTS "Anamnesis images are publicly accessible" ON storage.objects;

-- Create clinic-scoped SELECT policy
CREATE POLICY "Clinic users can view anamnesis images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'anamnesis-images'
  AND (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);
