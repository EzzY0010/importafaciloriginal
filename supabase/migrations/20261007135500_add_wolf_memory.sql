-- Memória privada do Lobo por usuário.
-- O conteúdo nunca fica disponível para outro usuário; somente o próprio
-- usuário e a service role podem consultar/gravar.
CREATE TABLE IF NOT EXISTS public.wolf_user_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'preference',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wolf_user_memory_unique UNIQUE (user_id, memory_key, memory_value)
);

ALTER TABLE public.wolf_user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Wolf memories"
  ON public.wolf_user_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wolf_user_memory_user
  ON public.wolf_user_memory(user_id, last_seen_at DESC);

-- Tendências agregadas e sem identificação pessoal. Não há user_id nem texto
-- original; a service role usa esta tabela apenas para estatísticas globais.
CREATE TABLE IF NOT EXISTS public.wolf_global_insights (
  insight_key TEXT NOT NULL,
  insight_value TEXT NOT NULL,
  mention_count INTEGER NOT NULL DEFAULT 1 CHECK (mention_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (insight_key, insight_value)
);

ALTER TABLE public.wolf_global_insights ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wolf_global_insights_count
  ON public.wolf_global_insights(mention_count DESC, updated_at DESC);

CREATE OR REPLACE FUNCTION public.increment_wolf_global_insight(p_key TEXT, p_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_key IS NULL OR p_value IS NULL OR length(p_key) > 80 OR length(p_value) > 120 THEN
    RETURN;
  END IF;
  INSERT INTO public.wolf_global_insights (insight_key, insight_value, mention_count)
  VALUES (p_key, lower(trim(p_value)), 1)
  ON CONFLICT (insight_key, insight_value)
  DO UPDATE SET mention_count = public.wolf_global_insights.mention_count + 1,
                updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wolf_global_insight(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wolf_global_insight(TEXT, TEXT) TO service_role;

REVOKE ALL ON public.wolf_user_memory FROM anon, authenticated;
REVOKE ALL ON public.wolf_global_insights FROM anon, authenticated;
GRANT SELECT ON public.wolf_user_memory TO authenticated;
