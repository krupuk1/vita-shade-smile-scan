-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
-- has_role is still usable inside RLS policies (evaluated as table owner)
-- handle_new_user/update_updated_at_column only run as triggers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;