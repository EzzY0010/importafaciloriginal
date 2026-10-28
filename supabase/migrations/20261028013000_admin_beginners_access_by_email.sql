-- Controle manual de emergência do plano Beginners por e-mail.
-- A função só pode ser chamada por uma conta com role admin.
CREATE OR REPLACE FUNCTION public.admin_set_beginners_access_by_email(
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

  -- Nunca transforma uma conta Full vigente em Beginners por engano.
  IF _enabled AND (
    target_profile.legacy_access IS TRUE
    OR (
      target_profile.has_paid IS TRUE
      AND target_profile.plan_type IS DISTINCT FROM 'beginners'
      AND target_profile.plan_type IS DISTINCT FROM 'grupo'
      AND target_profile.plan_expires_at IS NOT NULL
      AND target_profile.plan_expires_at > now()
    )
  ) THEN
    RAISE EXCEPTION 'Esta conta possui acesso Full ativo e não pode ser rebaixada para Beginners';
  END IF;

  IF NOT _enabled AND target_profile.plan_type IS DISTINCT FROM 'beginners' THEN
    RAISE EXCEPTION 'Esta conta não possui Beginners ativo';
  END IF;

  UPDATE public.profiles
  SET has_paid = _enabled,
      plan_type = CASE WHEN _enabled THEN 'beginners' ELSE NULL END,
      plan_expires_at = CASE WHEN _enabled THEN now() + interval '30 days' ELSE NULL END,
      legacy_access = CASE WHEN _enabled THEN false ELSE legacy_access END,
      updated_at = now()
  WHERE id = target_profile.id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_beginners_access_by_email(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_beginners_access_by_email(text, boolean) TO authenticated;
