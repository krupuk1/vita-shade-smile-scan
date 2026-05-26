
UPDATE storage.buckets SET public = false WHERE id = 'bucket-tintifylab3';

DROP POLICY IF EXISTS "tintifylab3 public read" ON storage.objects;

CREATE POLICY "tintifylab3 owner read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
  )
);
