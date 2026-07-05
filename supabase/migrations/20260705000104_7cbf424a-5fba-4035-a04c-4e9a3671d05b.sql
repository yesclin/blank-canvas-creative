
DROP POLICY IF EXISTS "finance receipts read" ON storage.objects;
CREATE POLICY "finance receipts read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'finance-receipts'
  AND (storage.foldername(name))[1] IN (SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "finance receipts insert" ON storage.objects;
CREATE POLICY "finance receipts insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'finance-receipts'
  AND (storage.foldername(name))[1] IN (SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "finance receipts delete" ON storage.objects;
CREATE POLICY "finance receipts delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'finance-receipts'
  AND (storage.foldername(name))[1] IN (SELECT clinic_id::text FROM public.profiles WHERE user_id = auth.uid())
);
