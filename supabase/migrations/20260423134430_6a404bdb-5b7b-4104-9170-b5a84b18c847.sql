-- Drop overly permissive policies on aesthetic-images bucket
DROP POLICY IF EXISTS "Authenticated users can view aesthetic images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload aesthetic images" ON storage.objects;

-- Path convention: {clinic_id}/{patient_id}/{filename}
-- Restrict all access to members of the owning clinic only.

CREATE POLICY "Clinic members can view aesthetic images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'aesthetic-images'
  AND (storage.foldername(name))[1]::uuid = public.user_clinic_id(auth.uid())
);

CREATE POLICY "Clinic members can upload aesthetic images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'aesthetic-images'
  AND (storage.foldername(name))[1]::uuid = public.user_clinic_id(auth.uid())
);

CREATE POLICY "Clinic members can update aesthetic images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'aesthetic-images'
  AND (storage.foldername(name))[1]::uuid = public.user_clinic_id(auth.uid())
)
WITH CHECK (
  bucket_id = 'aesthetic-images'
  AND (storage.foldername(name))[1]::uuid = public.user_clinic_id(auth.uid())
);

CREATE POLICY "Clinic members can delete aesthetic images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'aesthetic-images'
  AND (storage.foldername(name))[1]::uuid = public.user_clinic_id(auth.uid())
);