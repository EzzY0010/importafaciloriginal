-- Controle manual do acesso Full por e-mail.
-- A função só pode ser chamada por uma conta com role admin.
CREATE OR REPLACE FUNCTION public.admin_set_full_access_by_email(
  _email text,
  _enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(btrim(_email));
  target_profile public.profiles%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso administrativo necessário';
  END IF;
  IF normalized_email IS NULL OR normalized_email = '' OR position('@' in normalized_email) < 2 THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;

  SELECT * INTO target_profile
  FROM public.profiles
  WHERE lower(email) = normalized_email
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhuma conta encontrada para este e-mail';
  END IF;

  IF NOT _enabled AND (
    target_profile.legacy_access IS NOT TRUE
    OR target_profile.plan_type IS NULL
  ) THEN
    RAISE EXCEPTION 'Esta conta não possui acesso Full permanente';
  END IF;

  UPDATE public.profiles
  SET has_paid = _enabled,
      plan_type = CASE WHEN _enabled THEN 'vitalicio' ELSE NULL END,
      plan_expires_at = NULL,
      legacy_access = _enabled,
      updated_at = now()
  WHERE id = target_profile.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_full_access_by_email(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_full_access_by_email(text, boolean) TO authenticated;
