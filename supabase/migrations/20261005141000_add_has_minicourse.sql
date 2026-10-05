ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_minicourse boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.has_minicourse IS
  'Liberado exclusivamente pelo service role após compra aprovada do minicurso; não concede acesso à mentoria.';

CREATE OR REPLACE FUNCTION public.protect_has_minicourse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND NEW.has_minicourse IS DISTINCT FROM OLD.has_minicourse THEN
    RAISE EXCEPTION 'has_minicourse só pode ser alterado pelo service role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_has_minicourse ON public.profiles;
CREATE TRIGGER protect_has_minicourse
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_has_minicourse();
