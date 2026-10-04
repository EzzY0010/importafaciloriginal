ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legacy_access boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET legacy_access = true WHERE has_paid = true;

CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.has_paid = true
      AND (p.legacy_access = true OR (p.plan_expires_at IS NOT NULL AND p.plan_expires_at > now()))
  )
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text := coalesce(auth.role(), '');
BEGIN
  IF _role = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.has_paid := false;
    NEW.legacy_access := false;
    NEW.plan_expires_at := NULL;
    NEW.plan_type := NULL;
    RETURN NEW;
  END IF;

  IF NEW.legacy_access IS DISTINCT FROM OLD.legacy_access THEN
    RAISE EXCEPTION 'Alteração não permitida' USING ERRCODE = '42501';
  END IF;

  IF (NEW.has_paid IS DISTINCT FROM OLD.has_paid
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
      OR NEW.plan_type IS DISTINCT FROM OLD.plan_type
      OR NEW.unlimited_devices IS DISTINCT FROM OLD.unlimited_devices)
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Alteração não permitida' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_billing_fields ON public.profiles;
CREATE TRIGGER protect_profile_billing_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_billing_fields();

CREATE POLICY "Active access required for conversations"
ON public.conversations AS RESTRICTIVE FOR ALL TO authenticated
USING (public.has_active_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_active_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Active access required for messages"
ON public.messages AS RESTRICTIVE FOR ALL TO authenticated
USING (public.has_active_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_active_access(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE EXTENSION IF NOT EXISTS pg_cron;