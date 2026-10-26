REVOKE ALL ON FUNCTION public.admin_set_profile_access(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_access(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_access(uuid, boolean) TO authenticated;
