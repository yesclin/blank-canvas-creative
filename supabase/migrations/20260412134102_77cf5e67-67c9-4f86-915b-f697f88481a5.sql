
INSERT INTO storage.buckets (id, name, public)
VALUES ('aesthetic-images', 'aesthetic-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload aesthetic images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'aesthetic-images');

CREATE POLICY "Authenticated users can view aesthetic images"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'aesthetic-images');
