-- Criar bucket privado para documentos de fisioterapia
INSERT INTO storage.buckets (id, name, public)
VALUES ('fisioterapia-documentos', 'fisioterapia-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Política para visualizar documentos da própria clínica
CREATE POLICY "fisio_docs_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fisioterapia-documentos' AND
  (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Política para upload de documentos
CREATE POLICY "fisio_docs_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fisioterapia-documentos' AND
  (storage.foldername(name))[1] IN (
    SELECT clinic_id::text FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Política para deletar documentos (apenas próprios uploads)
CREATE POLICY "fisio_docs_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'fisioterapia-documentos' AND
  owner_id = auth.uid()::text
);