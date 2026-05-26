
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2) Storage RLS policies for bucket-tintifylab3 (public read, owner-scoped writes)
DROP POLICY IF EXISTS "tintifylab3 public read" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 user insert" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 user update" ON storage.objects;
DROP POLICY IF EXISTS "tintifylab3 user delete" ON storage.objects;

CREATE POLICY "tintifylab3 public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'bucket-tintifylab3');

CREATE POLICY "tintifylab3 user insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "tintifylab3 user update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "tintifylab3 user delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'bucket-tintifylab3'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
