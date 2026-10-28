-- Conteúdo público gerenciável pelo painel administrativo.
-- O registro é público para leitura; alterações são restritas por RLS a admins.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.site_settings FROM PUBLIC;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.site_settings TO authenticated;

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.site_settings (id, content)
VALUES (
  'global',
  jsonb_build_object(
    'announcement_enabled', false,
    'announcement_text', '',
    'hero_eyebrow', 'Garimpo internacional com mais clareza',
    'hero_title_prefix', 'Importar começa com',
    'hero_title_accent', 'a oportunidade certa.',
    'hero_subtitle', 'Conhecimento, ferramentas e fontes globais. Em um só lugar.',
    'hero_description', 'O ImportaFácil reúne inteligência de garimpo, busca internacional e cálculo de custos para ajudar você a pesquisar e planejar suas importações.',
    'hero_primary_cta', 'Ver planos e preços',
    'hero_secondary_cta', 'Como funciona',
    'hero_microcopy', 'Veja o valor primeiro. Seus dados só entram quando você decidir continuar.',
    'about_eyebrow', 'Quem somos',
    'about_title_prefix', 'Garimpo global,',
    'about_title_accent', 'organizado para você.',
    'about_lead', 'ImportaFácil é uma plataforma centralizadora de conhecimento, ferramentas e inteligência de garimpo internacional para importadores.',
    'about_description', 'Em vez de alternar entre guias, planilhas e dezenas de sites sem contexto, você encontra em um só ecossistema recursos para pesquisar produtos, explorar fontes globais e organizar os custos da sua operação.',
    'beginners_title', 'Importafacil Beginners',
    'beginners_description', 'Calculadora Pro, grupo exclusivo de Networking, suporte e aprendizado direto com o mentor.',
    'beginners_price', '37,00',
    'beginners_period', '/mês',
    'beginners_previous_price', '',
    'beginners_badge', '',
    'elite_title', 'Importafacil Elite',
    'elite_description', 'Acompanhamento completo e acesso vitalício ao ecossistema.',
    'elite_price', '497,00',
    'elite_period', 'à vista · pagamento único',
    'elite_previous_price', '797,00',
    'elite_badge', 'Melhor custo-benefício',
    'elite_included_benefit', '1 ano de Spotify Premium',
    'usa_title', 'Conexão USA',
    'usa_description', 'Grupo exclusivo no WhatsApp para lojistas, com promoções, peças a preço exclusivo e as fontes que os lojistas usam.',
    'usa_price', '120,00',
    'usa_period', '/mês',
    'whatsapp_number', '',
    'whatsapp_label', 'Fale conosco no WhatsApp'
  )
)
ON CONFLICT (id) DO NOTHING;

-- Habilita atualizações em tempo real para que visitantes com a página aberta
-- recebam alterações publicadas no painel sem precisar recarregar.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'site_settings'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings';
  END IF;
END
$$;
