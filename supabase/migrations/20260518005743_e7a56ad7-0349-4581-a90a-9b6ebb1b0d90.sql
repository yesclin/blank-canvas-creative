
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'],
    file_size_limit = 15728640
WHERE id = 'aesthetic-images';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png','image/jpeg','application/pdf'],
    file_size_limit = 5242880
WHERE id = 'signature-evidence';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf'],
    file_size_limit = 10485760
WHERE id = 'support-attachments';
