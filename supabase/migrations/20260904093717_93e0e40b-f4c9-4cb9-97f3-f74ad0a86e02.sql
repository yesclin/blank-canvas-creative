-- Políticas de acesso ao bucket privado clinical-media (isolamento por clinic_id na 1a pasta)
CREATE POLICY "clinical_media_select_own_clinic"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'clinical-media'
  AND (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
);

CREATE POLICY "clinical_media_insert_own_clinic"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clinical-media'
  AND (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
);

CREATE POLICY "clinical_media_update_own_clinic"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'clinical-media'
  AND (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
)
WITH CHECK (
  bucket_id = 'clinical-media'
  AND (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
);

CREATE POLICY "clinical_media_delete_own_clinic"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'clinical-media'
  AND (storage.foldername(name))[1] = public.get_user_clinic_id_for_rls()::text
);