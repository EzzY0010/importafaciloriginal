CREATE OR REPLACE FUNCTION public.admin_set_profile_access(
  _profile_id uuid,
  _enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso administrativo necessário';
  END IF;

  UPDATE public.profiles
  SET has_paid = _enabled,
      legacy_access = _enabled,
      plan_expires_at = NULL
  WHERE id = _profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_access(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_profile_access(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_access(uuid, boolean) TO authenticated;
