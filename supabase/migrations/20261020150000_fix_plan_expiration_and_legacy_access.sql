-- Corrige a regra de acesso legado e torna a extensão de planos cumulativa.
-- A migration anterior marcou todos os perfis pagos como vitalícios; somente
-- contas pagas criadas antes do lançamento dos planos com prazo devem ser legadas.

UPDATE public.profiles
SET legacy_access = true
WHERE has_paid = true
  AND created_at < TIMESTAMPTZ '2026-10-05T00:00:00Z'
  AND legacy_access = false;

UPDATE public.profiles
SET legacy_access = false
WHERE legacy_access = true
  AND (created_at IS NULL OR created_at >= TIMESTAMPTZ '2026-10-05T00:00:00Z');

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
      WHEN 'autonomo' THEN 30
      ELSE 30
    END;

    IF payment_row.plan_type = 'minicurso' THEN
      UPDATE public.profiles
      SET has_minicourse = true
      WHERE id = NEW.id;
    ELSE
      SELECT plan_expires_at
      INTO current_expiry
      FROM public.profiles
      WHERE id = NEW.id;

      next_expiry := GREATEST(now(), COALESCE(current_expiry, now()))
        + make_interval(days => duration_days);

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
