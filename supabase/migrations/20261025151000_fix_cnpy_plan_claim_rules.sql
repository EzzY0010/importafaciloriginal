-- Conexão USA não concede acesso ao site; Beginners concede apenas o acesso da Calculadora.
-- Usuários legados permanecem intocados durante a reconciliação por e-mail.
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
  current_expiry TIMESTAMPTZ;
  is_legacy BOOLEAN;
BEGIN
  IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  FOR payment_row IN
    SELECT * FROM public.payments
    WHERE status = 'approved'
      AND user_id IS NULL
      AND customer_email IS NOT NULL
      AND lower(customer_email) = lower(NEW.email)
    ORDER BY created_at ASC
  LOOP
    IF payment_row.plan_type = 'minicurso' THEN
      UPDATE public.profiles SET has_minicourse = true WHERE id = NEW.id;
    ELSE
      SELECT plan_expires_at, COALESCE(legacy_access, false)
      INTO current_expiry, is_legacy
      FROM public.profiles
      WHERE id = NEW.id;

      IF NOT is_legacy THEN
        duration_days := CASE payment_row.plan_type
          WHEN 'trimestral' THEN 90
          WHEN 'anual' THEN 365
          ELSE 30
        END;
        next_expiry := GREATEST(now(), COALESCE(current_expiry, now())) + make_interval(days => duration_days);
        UPDATE public.profiles
        SET has_paid = CASE WHEN payment_row.plan_type = 'grupo' THEN false ELSE true END,
            plan_type = COALESCE(payment_row.plan_type, 'mensal'),
            plan_expires_at = next_expiry
        WHERE id = NEW.id;
      END IF;
    END IF;

    UPDATE public.payments SET user_id = NEW.id WHERE id = payment_row.id;
  END LOOP;

  UPDATE public.purchases
  SET user_id = NEW.id
  WHERE status = 'approved'
    AND user_id IS NULL
    AND lower(email) = lower(NEW.email)
    AND product = 'minicurso';

  IF EXISTS (
    SELECT 1 FROM public.purchases
    WHERE status = 'approved' AND user_id = NEW.id AND product = 'minicurso'
  ) THEN
    UPDATE public.profiles SET has_minicourse = true WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS claim_cnpy_payments_after_profile ON public.profiles;
CREATE TRIGGER claim_cnpy_payments_after_profile
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.claim_cnpy_payments_for_profile();
