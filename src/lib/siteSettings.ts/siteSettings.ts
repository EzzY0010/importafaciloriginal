export type SiteSettings = {
  announcement_enabled: boolean;
  announcement_text: string;
  hero_eyebrow: string;
  hero_title_prefix: string;
  hero_title_accent: string;
  hero_subtitle: string;
  hero_description: string;
  hero_primary_cta: string;
  hero_secondary_cta: string;
  hero_microcopy: string;
  about_eyebrow: string;
  about_title_prefix: string;
  about_title_accent: string;
  about_lead: string;
  about_description: string;
  beginners_title: string;
  beginners_description: string;
  beginners_price: string;
  beginners_period: string;
  beginners_previous_price: string;
  beginners_badge: string;
  elite_title: string;
  elite_description: string;
  elite_price: string;
  elite_period: string;
  elite_previous_price: string;
  elite_badge: string;
  elite_included_benefit: string;
  usa_title: string;
  usa_description: string;
  usa_price: string;
  usa_period: string;
  whatsapp_number: string;
  whatsapp_label: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  announcement_enabled: false,
  announcement_text: "",
  hero_eyebrow: "Garimpo internacional com mais clareza",
  hero_title_prefix: "Importar começa com",
  hero_title_accent: "a oportunidade certa.",
  hero_subtitle: "Conhecimento, ferramentas e fontes globais. Em um só lugar.",
  hero_description: "O ImportaFácil reúne inteligência de garimpo, busca internacional e cálculo de custos para ajudar você a pesquisar e planejar suas importações.",
  hero_primary_cta: "Ver planos e preços",
  hero_secondary_cta: "Como funciona",
  hero_microcopy: "Veja o valor primeiro. Seus dados só entram quando você decidir continuar.",
  about_eyebrow: "Quem somos",
  about_title_prefix: "Garimpo global,",
  about_title_accent: "organizado para você.",
  about_lead: "ImportaFácil é uma plataforma centralizadora de conhecimento, ferramentas e inteligência de garimpo internacional para importadores.",
  about_description: "Em vez de alternar entre guias, planilhas e dezenas de sites sem contexto, você encontra em um só ecossistema recursos para pesquisar produtos, explorar fontes globais e organizar os custos da sua operação.",
  beginners_title: "Importafacil Beginners",
  beginners_description: "Calculadora Pro, grupo exclusivo de Networking, suporte e aprendizado direto com o mentor.",
  beginners_price: "37,00",
  beginners_period: "/mês",
  beginners_previous_price: "",
  beginners_badge: "",
  elite_title: "Importafacil Elite",
  elite_description: "Acompanhamento completo e acesso vitalício ao ecossistema.",
  elite_price: "497,00",
  elite_period: "à vista · pagamento único",
  elite_previous_price: "797,00",
  elite_badge: "Melhor custo-benefício",
  elite_included_benefit: "1 ano de Spotify Premium",
  usa_title: "Conexão USA",
  usa_description: "Grupo exclusivo no WhatsApp para lojistas, com promoções, peças a preço exclusivo e as fontes que os lojistas usam.",
  usa_price: "120,00",
  usa_period: "/mês",
  whatsapp_number: "",
  whatsapp_label: "Fale conosco no WhatsApp",
};

export function parseSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SITE_SETTINGS };
  }

  const incoming = value as Record<string, unknown>;
  const result = { ...DEFAULT_SITE_SETTINGS };
  for (const key of Object.keys(DEFAULT_SITE_SETTINGS) as (keyof SiteSettings)[]) {
    const nextValue = incoming[key];
    if (typeof nextValue === typeof DEFAULT_SITE_SETTINGS[key]) {
      (result as unknown as Record<string, unknown>)[key] = nextValue;
    }
  }
  return result;
}
