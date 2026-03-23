-- Fix: Make clinic-logos bucket private for better security

-- Update bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'clinic-logos';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view clinic logos" ON storage.objects;

-- Create policy to allow only authenticated users from the same clinic to view logos
CREATE POLICY "Clinic users can view their clinic logo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinic-logos' 
  AND (storage.foldername(name))[1] = user_clinic_id(auth.uid())::text
);
