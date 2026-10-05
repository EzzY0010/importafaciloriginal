-- Usuários antigos da mentoria permanecem com acesso permanente.
-- Novos usuários continuam usando plan_expires_at conforme o plano comprado.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_access boolean NOT NULL DEFAULT false;

-- Todos os usuários que já estavam pagos quando esta regra for aplicada são
-- considerados antigos e preservados, mesmo que já possuam uma data vencida.
UPDATE public.profiles
SET legacy_access = true
WHERE has_paid = true
  AND legacy_access = false;

COMMENT ON COLUMN public.profiles.legacy_access IS
  'Acesso vitalício concedido a usuários antigos da mentoria; não deve expirar por plan_expires_at.';
