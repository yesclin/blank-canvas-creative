-- Tornar o bucket aesthetic-images privado
UPDATE storage.buckets SET public = false WHERE id = 'aesthetic-images';

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload aesthetic images" ON storage.objects;
DROP POLICY IF EXISTS "clinic_members_view_aesthetic_images" ON storage.objects;
DROP POLICY IF EXISTS "clinic_members_upload_aesthetic_images" ON storage.objects;
DROP POLICY IF EXISTS "clinic_members_delete_aesthetic_images" ON storage.objects;

-- Política SELECT: membros da clínica podem ver imagens
CREATE POLICY "clinic_members_view_aesthetic_images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'aesthetic-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Política INSERT: membros da clínica podem fazer upload
CREATE POLICY "clinic_members_upload_aesthetic_images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'aesthetic-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Política UPDATE: membros da clínica podem atualizar
CREATE POLICY "clinic_members_update_aesthetic_images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'aesthetic-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Política DELETE: membros da clínica podem deletar
CREATE POLICY "clinic_members_delete_aesthetic_images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'aesthetic-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);