-- ImportaFácil: separa o novo plano Beginners dos usuários ativos existentes.
-- A atualização de legado preserva o acesso atual de todos os usuários pagos
-- antes da ativação desta migration.
UPDATE public.profiles
SET legacy_access = true,
    plan_expires_at = NULL,
    updated_at = now()
WHERE has_paid IS TRUE
  AND legacy_access IS NOT TRUE;

CREATE OR REPLACE FUNCTION public.has_full_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = _user_id
      AND profile.has_paid IS TRUE
      AND (
        profile.legacy_access IS TRUE
        OR (
          profile.plan_expires_at IS NOT NULL
          AND profile.plan_expires_at > now()
          AND profile.plan_type IS DISTINCT FROM 'beginners'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_calculator_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = _user_id
      AND profile.has_paid IS TRUE
      AND (
        (profile.legacy_access IS TRUE AND profile.plan_expires_at IS NULL)
        OR (profile.plan_expires_at IS NOT NULL AND profile.plan_expires_at > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_full_access(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_calculator_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_full_access(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_calculator_access(uuid) TO service_role;
