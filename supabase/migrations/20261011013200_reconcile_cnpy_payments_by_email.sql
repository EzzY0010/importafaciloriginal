-- Reconcile hosted CN Pay checkouts with accounts created after payment.
-- The hosted checkout can complete before the customer creates an account in the SaaS.
ALTER TABLE public.payments
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS plan_type TEXT;

CREATE INDEX IF NOT EXISTS payments_customer_email_status_idx
  ON public.payments (lower(customer_email), status);

CREATE UNIQUE INDEX IF NOT EXISTS payments_external_reference_unique_idx
  ON public.payments (external_reference);

CREATE OR REPLACE FUNCTION public.claim_cnpy_payments_for_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  duration_days INTEGER;
  next_expiry TIMESTAMPTZ;
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
    ELSE
      next_expiry := now() + make_interval(days => duration_days);
      UPDATE public.profiles
      SET has_paid = true,
          plan_type = COALESCE(payment_row.plan_type, 'mensal'),
          plan_expires_at = CASE WHEN legacy_access THEN NULL ELSE next_expiry END
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
