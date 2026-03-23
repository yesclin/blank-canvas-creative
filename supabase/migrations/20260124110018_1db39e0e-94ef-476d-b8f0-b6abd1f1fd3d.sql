
-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-logos', 
  'clinic-logos', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow users to upload logos for their own clinic
CREATE POLICY "Users can upload logo for their clinic"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = user_clinic_id(auth.uid())::text
);

-- Allow users to update/replace their clinic logo
CREATE POLICY "Users can update logo for their clinic"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'clinic-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = user_clinic_id(auth.uid())::text
);

-- Allow users to delete their clinic logo
CREATE POLICY "Users can delete logo for their clinic"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'clinic-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = user_clinic_id(auth.uid())::text
);

-- Public read access for logos (needed for display)
CREATE POLICY "Anyone can view clinic logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'clinic-logos');
