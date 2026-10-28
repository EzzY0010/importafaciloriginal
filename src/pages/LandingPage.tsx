import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  Crown,
  Gem,
  Globe,
  PackageSearch,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BEGINNERS_CHECKOUT_URL, CN_PAY_CHECKOUTS, getPlanCheckoutUrl } from "@/config/checkouts";
import LeadCaptureInline from "@/components/LeadCaptureInline";
import { getSupabaseClient } from "@/lib/backend";
import { DEFAULT_SITE_SETTINGS, parseSiteSettings, type SiteSettings } from "@/lib/siteSettings";

type LandingPlan = {
  title: string;
  description: string;
  price: string;
  period: string;
  previousPrice?: string;
  priceNote?: string;
  badge?: string;
  includedBenefit?: string;
  checkoutUrl?: string;
  features: string[];
  featureGroups?: { title: string; items: string[] }[];
  ctaLabel?: string;
  featured?: boolean;
  icon: ReactNode;
};

const landingPlans: LandingPlan[] = [
  {
    title: "Importafacil Beginners",
    description: "Calculadora Pro, grupo exclusivo de Networking, suporte e aprendizado direto com o mentor.",
    price: "37,00",
    period: "/mês",
    features: [
      "Calculadora Pro",
      "Grupo exclusivo de Networking deste plano",
      "Suporte para dúvidas",
      "Aprendizado somente em Vinted e Grailed, com o mentor, passo a passo individual no privado",
    ],
    checkoutUrl: BEGINNERS_CHECKOUT_URL,
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Importafacil Elite",
    description: "Acompanhamento completo e acesso vitalício ao ecossistema.",
    price: "497,00",
    period: "à vista · pagamento único",
    previousPrice: "797,00",
    badge: "Melhor custo-benefício",
    checkoutUrl: getPlanCheckoutUrl("anual"),
    features: [],
    featureGroups: [
      {
        title: "Aulas",
        items: [
          "Todos os recursos da mentoria",
          "Todos os recursos do site",
          "Depop, Vinted, Graded e outras plataformas de revenda (avançado)",
          "Aula de fotos profissionais de roupas",
          "Aula de Canva para a identidade visual da loja",
          "Treinamento de vendas, precificação e escala",
          "Mais de 15 Fontes de Garimpo",
        ],
      },
      {
        title: "Comunidade",
        items: [
          "Acesso ao grupo do WhatsApp",
          "Grupo de Networking VIP exclusivo",
        ],
      },
      {
        title: "Suporte e bônus",
        items: [
          "Spotify Premium individual por 1 ano incluso",
          "Acompanhamento na Primeira Importação",
          "Suporte Prioritário em até 24h",
      "Condições especiais de upgrade para quem vem do plano de R$ 37",
          "Acesso vitalício: para sempre",
        ],
      },
    ],
    featured: true,
    includedBenefit: "1 ano de Spotify Premium",
    icon: <Crown className="h-5 w-5" />,
  },
  {
    title: "Conexão USA",
    description: "Grupo exclusivo no WhatsApp para lojistas, com promoções, peças a preço exclusivo e as fontes que os lojistas usam.",
    price: "120,00",
    period: "/mês",
    features: [
      "Grupo exclusivo no WhatsApp para lojistas",
      "Promoções e peças com preço exclusivo",
      "Fontes que os lojistas usam",
    ],
    checkoutUrl: CN_PAY_CHECKOUTS.mensal,
    icon: <ShoppingBag className="h-5 w-5" />,
  },
];

const LandingPlanCard = ({ plan }: { plan: LandingPlan }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = expanded ? plan.features : plan.features.slice(0, 6);
  const hasMoreFeatures = plan.features.length > 6;

  return (<article
    className={`relative flex h-full flex-col rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
      plan.featured
        ? "border-gold/60 bg-[linear-gradient(160deg,hsl(var(--gold)/0.14),hsl(var(--hero-bg))_55%)] shadow-[0_0_42px_hsl(43_80%_55%_/_0.13)]"
        : "border-hero-foreground/12 bg-hero-foreground/[0.035] hover:border-gold/35"
    }`}
  >
    {plan.badge && (
      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-gold-foreground shadow-lg">
        <Crown className="h-3.5 w-3.5" /> {plan.badge}
      </div>
    )}
    <div className="mb-5 flex items-start gap-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${plan.featured ? "bg-gold text-gold-foreground" : "bg-hero-foreground/8 text-gold"}`}>
        {plan.icon}
      </span>
      <div className="pt-0.5">
        <h3 className="font-bold text-hero-foreground">{plan.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-hero-foreground/60">{plan.description}</p>
      </div>
    </div>
    <div className="mb-5 min-h-[92px] border-b border-hero-foreground/10 pb-5">
      {plan.previousPrice && <p className="text-xs text-hero-foreground/55 line-through">De R$ {plan.previousPrice}</p>}
      {plan.priceNote && <p className="mb-1 text-[10px] leading-relaxed text-hero-foreground/55">{plan.priceNote}</p>}
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-hero-foreground/55">R$</span>
        <span className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${plan.featured ? "text-gold" : "text-hero-foreground"}`}>{plan.price}</span>
        <span className="text-xs text-hero-foreground/55">{plan.period}</span>
      </p>
    </div>
    {plan.includedBenefit && (
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 text-xs font-bold text-gold">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>Incluso: {plan.includedBenefit}</span>
      </div>
    )}
    {plan.featureGroups ? (
      <div className="mb-6 flex-1 space-y-4">
        {plan.featureGroups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gold">{group.title}</h4>
            <ul className="space-y-2.5">
              {group.items.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-hero-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ) : (
      <ul className="mb-2 flex-1 space-y-3">
        {visibleFeatures.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-hero-foreground/80">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <span>{feature}</span>
        </li>
        ))}
      </ul>
    )}
    {hasMoreFeatures && (
      <button type="button" onClick={() => setExpanded((value) => !value)} className="mb-4 self-start text-xs font-bold text-gold underline underline-offset-4 hover:text-gold/80">
        {expanded ? "Ver menos" : "Ver tudo"}
      </button>
    )}
    {plan.checkoutUrl ? (
      <Button asChild className="mt-auto h-11 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-[0_0_18px_hsl(43_80%_55%_/_0.16)] hover:bg-gold/90">
        <a href={plan.checkoutUrl} aria-label={`Escolher ${plan.title}`}>
          {plan.ctaLabel ?? "Quero conhecer"} <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    ) : (
      <Button disabled className="mt-auto h-11 w-full rounded-xl bg-gold/70 font-bold text-gold-foreground">
        {plan.ctaLabel ?? "Em breve"}
      </Button>
    )}
  </article>);
};

const SectionHeading = ({ eyebrow, title, accent, description }: { eyebrow: string; title: string; accent?: string; description?: string }) => (
  <div className="mx-auto mb-10 max-w-2xl text-center">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80 sm:text-xs">{eyebrow}</p>
    <h2 className="text-3xl font-extrabold tracking-tight text-hero-foreground sm:text-4xl">
      {title} {accent && <span className="text-gold">{accent}</span>}
    </h2>
    {description && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-hero-foreground/65 sm:text-base">{description}</p>}
  </div>
);

const ecosystemPreviews = [
  {
    title: "Início",
    image: "/assets/ecossistema-inicio.webp",
    alt: "Tela Início do ImportaFácil no celular, com análise de produtos, fornecedores e ferramentas rápidas.",
    caption: "Analise produtos por foto e encontre fornecedores.",
  },
  {
    title: "IA Lobo",
    image: "/assets/ecossistema-ia-lobo.webp",
    alt: "Tela IA Lobo do ImportaFácil no celular, com respostas e estratégias de importação.",
    caption: "Tire dúvidas e descubra se vale a pena importar.",
  },
  {
    title: "Calculadora",
    image: "/assets/ecossistema-calculadora.webp",
    alt: "Tela Calculadora do ImportaFácil no celular, com conversão de moedas, frete e precificação.",
    caption: "Converta moedas e calcule custo, frete e margem.",
  },
];

const LandingPage = () => {
  const { user, hasPaid, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>({ ...DEFAULT_SITE_SETTINGS });

  useEffect(() => {
    let active = true;
    let channel: { unsubscribe: () => Promise<unknown> } | null = null;
    void (async () => {
      const supabase = await getSupabaseClient();
      if (!supabase || !active) return;
      const { data } = await supabase
        .from("site_settings")
        .select("content")
        .eq("id", "global")
        .maybeSingle();
      if (active && data) setSettings(parseSiteSettings(data.content));
      channel = supabase
        .channel("public-site-settings-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_settings", filter: "id=eq.global" },
          (payload) => {
            const content = (payload.new as { content?: unknown })?.content;
            if (active && content) setSettings(parseSiteSettings(content));
          },
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) void channel.unsubscribe();
    };
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPlans = () => scrollToSection("plans-section");
  const scrollToManifesto = () => scrollToSection("quem-somos");
  const whatsappDigits = settings.whatsapp_number.replace(/\D/g, "");
  const publicPlans: LandingPlan[] = [
    {
      ...landingPlans[0],
      title: settings.beginners_title,
      description: settings.beginners_description,
      price: settings.beginners_price,
      period: settings.beginners_period,
      previousPrice: settings.beginners_previous_price.trim() || undefined,
      badge: settings.beginners_badge.trim() || undefined,
    },
    {
      ...landingPlans[1],
      title: settings.elite_title,
      description: settings.elite_description,
      price: settings.elite_price,
      period: settings.elite_period,
      previousPrice: settings.elite_previous_price.trim() || undefined,
      badge: settings.elite_badge.trim() || undefined,
      includedBenefit: settings.elite_included_benefit.trim() || undefined,
    },
    {
      ...landingPlans[2],
      title: settings.usa_title,
      description: settings.usa_description,
      price: settings.usa_price,
      period: settings.usa_period,
    },
  ];

  const problems = [
    { icon: <ShieldAlert className="h-5 w-5" />, title: "Medo de golpes", text: "Dificuldade para avaliar anúncios, produtos e vendedores antes de comprar." },
    { icon: <PackageSearch className="h-5 w-5" />, title: "Fornecedores ruins", text: "Muitas fontes espalhadas e pouco contexto para encontrar boas oportunidades." },
    { icon: <WalletCards className="h-5 w-5" />, title: "Taxas surpresa", text: "Custos de frete, conversão e importação que aparecem tarde demais na conta." },
    { icon: <Calculator className="h-5 w-5" />, title: "Margem sem clareza", text: "Sem uma ferramenta prática para estimar o custo final e precificar melhor." },
    { icon: <Clock3 className="h-5 w-5" />, title: "Processo manual demorado", text: "Pesquisar, traduzir e comparar tudo à mão consome tempo e atrasa decisões." },
  ];

  const deliverables = [
    { icon: <Brain className="h-5 w-5" />, title: "IA Garimpeira · Lobo das Importações", text: "Analise produtos por foto, explore buscas de marcas e estime sua margem antes de decidir." },
    { icon: <Globe className="h-5 w-5" />, title: "Busca Global Copia e Cola", text: "Encontre termos e oportunidades em plataformas internacionais sem deixar o idioma travar sua pesquisa." },
    { icon: <Calculator className="h-5 w-5" />, title: "Calculadora Pro Multimoedas", text: "Converta valores e simule frete, custos e preço final para planejar com mais contexto." },
    { icon: <Gem className="h-5 w-5" />, title: "Acesso às Fontes Globais", text: "Navegue por bases de garimpo da China, Europa e Estados Unidos em um só lugar." },
  ];

  return (
    <div translate="no" className="bg-hero text-hero-foreground">
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <img src={wolfLogo} alt="" className="w-[60vw] sm:w-[40vw] max-w-[500px] opacity-[0.055] select-none" />
      </div>

      {settings.announcement_enabled && settings.announcement_text.trim() && (
        <div role="status" className="relative z-10 bg-gold px-4 py-2.5 text-center text-xs font-bold text-gold-foreground sm:text-sm">
          {settings.announcement_text}
        </div>
      )}

      <section className="relative z-10 flex min-h-[86svh] flex-col items-center justify-center px-5 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/90 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> {settings.hero_eyebrow}
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl">
            {settings.hero_title_prefix} <span className="text-gold">{settings.hero_title_accent}</span>
            <span className="mt-3 block text-2xl font-semibold leading-tight text-hero-foreground/75 sm:text-3xl lg:text-4xl">
              {settings.hero_subtitle}
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-hero-foreground/70 sm:text-base lg:text-lg">
            {settings.hero_description}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button onClick={scrollToPlans} className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-bold text-gold-foreground shadow-[0_0_25px_hsl(43_80%_55%_/_0.22)] transition-colors hover:bg-gold/90">{settings.hero_primary_cta} <ArrowRight className="ml-2 h-4 w-4" /></button>
            <button onClick={scrollToManifesto} className="inline-flex h-12 items-center justify-center rounded-xl border border-hero-foreground/15 px-6 text-sm font-semibold text-hero-foreground/75 transition-colors hover:border-gold/40 hover:text-gold">{settings.hero_secondary_cta} <ChevronDown className="ml-2 h-4 w-4" /></button>
            {whatsappDigits && (
              <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-xl border border-hero-foreground/15 px-5 text-sm font-semibold text-hero-foreground/75 transition-colors hover:border-gold/40 hover:text-gold">
                {settings.whatsapp_label}
              </a>
            )}
          </div>
          <p className="text-xs text-hero-foreground/45">{settings.hero_microcopy}</p>
        </div>
      </section>

      <nav id="section-navigation" aria-label="Navegação pública" className="sticky top-0 z-30 border-y border-hero-foreground/10 bg-hero/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-thin sm:px-6">
          <Link to="/" className="mr-auto shrink-0 text-sm font-extrabold tracking-tight text-hero-foreground">Importa<span className="text-gold">Fácil</span></Link>
          <a href="#o-que-entregamos" className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-hero-foreground/65 transition-colors hover:bg-gold/10 hover:text-gold">Como funciona</a>
          <Link to="/ferramentas" className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-hero-foreground/65 transition-colors hover:bg-gold/10 hover:text-gold">Ferramentas</Link>
          <a href="#plans-section" className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-hero-foreground/65 transition-colors hover:bg-gold/10 hover:text-gold">Planos</a>
          <a href="#faq" className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-hero-foreground/65 transition-colors hover:bg-gold/10 hover:text-gold">FAQ</a>
          <Link to="/login" className="shrink-0 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-gold-foreground transition-colors hover:bg-gold/90">Entrar</Link>
        </div>
      </nav>

      <section id="quem-somos" className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <span id="manifesto-section" className="scroll-mt-24" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80 sm:text-xs">{settings.about_eyebrow}</p>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">{settings.about_title_prefix} <span className="text-gold">{settings.about_title_accent}</span></h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-hero-foreground/70 sm:text-base">
            <p><span className="font-semibold text-hero-foreground">{settings.about_lead}</span></p>
            <p>{settings.about_description}</p>
            <a href="#por-dentro" className="inline-flex items-center gap-2 pt-1 text-sm font-bold text-gold transition-colors hover:text-gold/80">Veja por dentro da plataforma <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>

      <section id="o-que-resolvemos" className="relative z-10 scroll-mt-24 border-y border-hero-foreground/5 bg-hero-foreground/[0.018] px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="O que resolvemos" title="Importar não precisa ser" accent="um salto no escuro." description="Reunimos contexto e ferramentas para reduzir as dúvidas que tornam o garimpo internacional confuso e demorado." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {problems.map((problem) => (
              <article key={problem.title} className="rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-4 transition-colors hover:border-gold/25 sm:p-5">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">{problem.icon}</span>
                <h3 className="mb-2 text-sm font-bold text-hero-foreground">{problem.title}</h3>
                <p className="text-xs leading-relaxed text-hero-foreground/60">{problem.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="o-que-entregamos" className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24">
        <span id="deliverables-section" className="scroll-mt-24" aria-hidden="true" />
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="O que entregamos" title="Um ecossistema para" accent="garimpar melhor." description="Ferramentas integradas para encontrar, analisar e precificar oportunidades de diferentes mercados." />
          <div className="grid gap-4 sm:grid-cols-2">
            {deliverables.map((item, index) => (
              <article key={item.title} className="group flex gap-4 rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/15 bg-gold/[0.08] text-gold transition-colors group-hover:bg-gold group-hover:text-gold-foreground">{item.icon}</span>
                <div><p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-hero-foreground/35">0{index + 1}</p><h3 className="mb-2 text-base font-bold text-hero-foreground">{item.title}</h3><p className="text-sm leading-relaxed text-hero-foreground/60">{item.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="por-dentro" className="relative z-10 scroll-mt-24 border-y border-hero-foreground/5 bg-hero-foreground/[0.018] px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Por dentro do site" title="Conheça o" accent="ecossistema." description="Uma prévia visual das ferramentas que ajudam você a analisar produtos, encontrar fontes e estimar custos." />
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
            {ecosystemPreviews.map((preview) => (
              <article key={preview.title} className="group min-w-[88%] snap-center rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.025] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 sm:min-w-[72%] sm:p-5 lg:min-w-0">
                <div className="flex h-[520px] items-center justify-center overflow-hidden rounded-2xl border border-hero-foreground/10 bg-[#0B1220] p-2 sm:h-[560px]">
                  <img
                    src={preview.image}
                    alt={preview.alt}
                    width={720}
                    height={1485}
                    loading="lazy"
                    className="h-full w-auto max-w-full rounded-xl object-contain"
                  />
                </div>
                <div className="px-1 pb-1 pt-5">
                  <h3 className="mb-2 text-sm font-bold text-hero-foreground">{preview.title}</h3>
                  <p className="text-xs leading-relaxed text-hero-foreground/60">{preview.caption}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] text-hero-foreground/35">Deslize no celular para conhecer cada tela do ecossistema.</p>
        </div>
      </section>

      <section id="lead-capture" className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80 sm:text-xs">Um passo antes de começar</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-hero-foreground sm:text-4xl">Conte um pouco sobre o seu momento.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-hero-foreground/65 sm:text-base">Com duas etapas rápidas, entendemos o que você busca e mostramos o caminho mais claro para começar.</p>
          <div className="mt-8">
            <LeadCaptureInline scrollToPlansId="plans-section" />
          </div>
        </div>
      </section>

      <section id="plans-section" className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Planos" title="Escolha como quer" accent="começar." description="Do primeiro passo na Vinted ao acompanhamento completo da sua importação." />
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {publicPlans.map((plan) => <LandingPlanCard key={plan.title} plan={plan} />)}
          </div>
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-[11px] text-hero-foreground/50">
            <span>Pagamento processado com segurança</span><span>•</span><span>Pix e checkout online</span><span>•</span><span>Liberação após confirmação</span>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-[10px] leading-relaxed text-hero-foreground/40">
            As opções e os valores exibidos nesta página são informativos. Os links de checkout continuam apontando para a configuração atual da plataforma.
          </p>
        </div>
      </section>

      <section id="faq" className="relative z-10 scroll-mt-24 border-t border-hero-foreground/5 bg-hero-foreground/[0.018] px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Dúvidas rápidas" title="Tudo claro antes de" accent="começar." description="As respostas essenciais para conhecer a plataforma sem complicação." />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["O que encontro na plataforma?", "Ferramentas para analisar produtos, pesquisar fontes internacionais e estimar custos e margem."],
              ["Preciso preencher meus dados para ver os preços?", "Não. Os planos e preços aparecem antes. Seus dados só são solicitados quando você decidir continuar para o checkout."],
              ["Como o acesso é liberado?", "Depois da confirmação do pagamento, o acesso é associado à sua conta e você entra pela página de login."],
              ["Posso começar por um plano menor?", "Sim. Você pode começar pelo Importafacil Beginners e evoluir para o Importafacil Elite quando fizer sentido."],
            ].map(([question, answer]) => <article key={question} className="rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-5"><h3 className="text-sm font-bold text-hero-foreground">{question}</h3><p className="mt-2 text-sm leading-relaxed text-hero-foreground/60">{answer}</p></article>)}
          </div>
        </div>
      </section>
    </div>

  );
};

export default LandingPage;
