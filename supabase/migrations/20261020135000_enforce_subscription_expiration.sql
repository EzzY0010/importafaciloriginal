CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
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

REVOKE ALL ON FUNCTION public.has_active_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_cnpy_payments_for_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  duration_days integer;
  current_expiry timestamptz;
  is_legacy boolean;
  next_expiry timestamptz;
BEGIN
  IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  FOR payment_row IN
    SELECT *
    FROM public.payments
    WHERE status = 'approved'
      AND user_id IS NULL
      AND customer_email IS NOT NULL
      AND lower(customer_email) = lower(NEW.email)
    ORDER BY created_at ASC
  LOOP
    duration_days := CASE payment_row.plan_type
      WHEN 'trimestral' THEN 90
      WHEN 'anual' THEN 365
      ELSE 30
    END;

    IF payment_row.plan_type = 'minicurso' THEN
      UPDATE public.profiles
      SET has_minicourse = true
      WHERE id = NEW.id;
    ELSIF payment_row.plan_type = 'vitalicio' THEN
      UPDATE public.profiles
      SET has_paid = true,
          plan_type = 'vitalicio',
          legacy_access = true,
          plan_expires_at = NULL
      WHERE id = NEW.id;
    ELSE
      SELECT plan_expires_at, COALESCE(legacy_access, false)
      INTO current_expiry, is_legacy
      FROM public.profiles
      WHERE id = NEW.id
      FOR UPDATE;

      IF is_legacy AND current_expiry IS NULL THEN
        next_expiry := NULL;
      ELSE
        next_expiry := greatest(now(), COALESCE(current_expiry, '-infinity'::timestamptz))
          + make_interval(days => duration_days);
      END IF;

      UPDATE public.profiles
      SET has_paid = true,
          plan_type = COALESCE(payment_row.plan_type, 'mensal'),
          plan_expires_at = next_expiry
      WHERE id = NEW.id;
    END IF;

    UPDATE public.payments
    SET user_id = NEW.id
    WHERE id = payment_row.id;
  END LOOP;

  UPDATE public.purchases
  SET user_id = NEW.id
  WHERE status = 'approved'
    AND user_id IS NULL
    AND lower(email) = lower(NEW.email)
    AND product = 'minicurso';

  IF EXISTS (
    SELECT 1
    FROM public.purchases
    WHERE status = 'approved'
      AND user_id = NEW.id
      AND product = 'minicurso'
  ) THEN
    UPDATE public.profiles
    SET has_minicourse = true
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claim_cnpy_payments_after_profile ON public.profiles;
CREATE TRIGGER claim_cnpy_payments_after_profile
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.claim_cnpy_payments_for_profile();
