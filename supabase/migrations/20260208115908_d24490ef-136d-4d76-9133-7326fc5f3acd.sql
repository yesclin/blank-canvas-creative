-- Create storage bucket for anamnesis template images
INSERT INTO storage.buckets (id, name, public)
VALUES ('anamnesis-images', 'anamnesis-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Anyone can view anamnesis images (they're clinic assets)
CREATE POLICY "Anamnesis images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'anamnesis-images');

-- RLS policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload anamnesis images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'anamnesis-images' 
  AND auth.role() = 'authenticated'
);

-- RLS policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update anamnesis images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'anamnesis-images' 
  AND auth.role() = 'authenticated'
);

-- RLS policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete anamnesis images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'anamnesis-images' 
  AND auth.role() = 'authenticated'
);