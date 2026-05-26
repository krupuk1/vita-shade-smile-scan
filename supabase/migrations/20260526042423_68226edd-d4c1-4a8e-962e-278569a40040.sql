
DROP POLICY IF EXISTS "tintifylab3 user insert" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 user update" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 user delete" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 owner read" ON storage.objects;

CREATE POLICY "tintifylab3 owner read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND (
    auth.uid()::text = (storage.foldername(name))[2]
    OR app_private.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "tintifylab3 user insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "tintifylab3 user update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "tintifylab3 user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
