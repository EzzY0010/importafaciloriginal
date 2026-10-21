import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  Crown,
  Gem,
  Globe,
  Headset,
  PackageSearch,
  Search,
  ShieldAlert,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import homeScreenPreview from "@/assets/importafacil-home-preview.webp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CN_PAY_CHECKOUTS, getPlanCheckoutUrl } from "@/config/checkouts";

type LandingPlan = {
  title: string;
  description: string;
  price: string;
  period: string;
  previousPrice?: string;
  priceNote?: string;
  badge?: string;
  includedBenefit?: string;
  checkoutUrl: string;
  features: string[];
  featured?: boolean;
  icon: ReactNode;
};

const landingPlans: LandingPlan[] = [
  {
    title: "Minicurso PDF + Desafios",
    description: "Um passo a passo prático para dominar o garimpo de peças na Vinted.",
    price: "14,99",
    period: "pagamento único",
    checkoutUrl: CN_PAY_CHECKOUTS.minicurso,
    features: ["7 PDFs com conteúdo prático", "Desafios para aplicar o que aprendeu", "Foco específico em garimpo na Vinted"],
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Acesso ao Site",
    description: "As principais ferramentas para garimpar e analisar oportunidades.",
    price: "34,99",
    period: "/mês",
    checkoutUrl: getPlanCheckoutUrl("autonomo"),
    features: [
      "IA Especialista em Importação",
      "Busca Global Copia e Cola",
      "Calculadora Pro",
      "Fontes Principais de Garimpo",
      "Acesso ao Grupo do WhatsApp",
      "Suporte para dúvidas da plataforma em até 48h",
    ],
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Mentoria Mensal",
    description: "Acompanhamento completo para avançar com mais segurança.",
    price: "197,90",
    period: "/mês",
    checkoutUrl: getPlanCheckoutUrl("mensal"),
    features: [
      "Spotify Premium individual por 1 mês incluso",
      "Todos os recursos da mentoria",
      "Todos os recursos do site",
      "Acesso ao grupo do WhatsApp",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Suporte Prioritário em até 24h",
    ],
    includedBenefit: "1 mês de Spotify Premium",
    icon: <Headset className="h-5 w-5" />,
  },
  {
    title: "Mentoria VIP Vitalícia",
    description: "Acompanhamento completo e acesso vitalício ao ecossistema.",
    price: "499,00",
    period: "à vista · pagamento único",
    previousPrice: "799,00",
    badge: "Melhor custo-benefício",
    checkoutUrl: getPlanCheckoutUrl("anual"),
    features: [
      "Spotify Premium individual por 1 ano incluso",
      "Todos os recursos da mentoria",
      "Todos os recursos do site",
      "Acesso ao grupo do WhatsApp",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Suporte Prioritário em até 24h",
      "Acesso vitalício: para sempre",
    ],
    featured: true,
    includedBenefit: "1 ano de Spotify Premium",
    icon: <Crown className="h-5 w-5" />,
  },
];

const LandingPlanCard = ({ plan }: { plan: LandingPlan }) => (
  <article
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
    <ul className="mb-6 flex-1 space-y-3">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-xs leading-relaxed text-hero-foreground/80">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button
      asChild
      className="mt-auto h-11 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-[0_0_18px_hsl(43_80%_55%_/_0.16)] hover:bg-gold/90"
    >
      <a href={plan.checkoutUrl} aria-label={`Escolher ${plan.title}`}>
        Quero conhecer <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </Button>
  </article>
);

const SectionHeading = ({ eyebrow, title, accent, description }: { eyebrow: string; title: string; accent?: string; description?: string }) => (
  <div className="mx-auto mb-10 max-w-2xl text-center">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80 sm:text-xs">{eyebrow}</p>
    <h2 className="text-3xl font-extrabold tracking-tight text-hero-foreground sm:text-4xl">
      {title} {accent && <span className="text-gold">{accent}</span>}
    </h2>
    {description && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-hero-foreground/65 sm:text-base">{description}</p>}
  </div>
);

const ProductPreview = () => (
  <div className="overflow-hidden rounded-2xl border border-hero-foreground/10 bg-[#0b1018] p-3 shadow-2xl" aria-label="Captura da tela inicial do ImportaFácil">
    <p className="mb-2 text-center text-[9px] font-medium uppercase tracking-wider text-hero-foreground/40">Tela inicial · experiência mobile</p>
    <div className="flex h-[340px] items-center justify-center overflow-hidden rounded-xl bg-black/40 p-2">
      <img
        src={homeScreenPreview}
        alt="Tela inicial do ImportaFácil no celular, com análise de produto, fontes de garimpo e ferramentas rápidas"
        loading="lazy"
        className="h-full w-auto max-w-full rounded-lg object-contain"
      />
    </div>
  </div>
);

const SourcesPreview = () => (
  <div className="overflow-hidden rounded-2xl border border-hero-foreground/10 bg-[#0b1018] shadow-2xl" aria-label="Prévia visual ilustrativa das fontes globais de garimpo">
    <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/[0.025] px-3 py-2.5">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
      <span className="ml-2 truncate text-[9px] font-medium text-white/45">importafacil.app / fontes-globais</span>
    </div>
    <div className="space-y-3 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-[10px] font-semibold text-white/85"><span className="rounded-lg bg-sky-400/10 p-1.5 text-sky-300"><Globe className="h-3.5 w-3.5" /></span> Bases &amp; Fontes de Garimpo</div><Search className="h-3.5 w-3.5 text-white/35" /></div>
      <div className="flex flex-wrap gap-1.5">
        {["China", "Europa", "Estados Unidos"].map((region) => <span key={region} className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[8px] text-white/55">{region}</span>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["DHgate", "Catálogos", "Xianyu", "1688", "Taobao", "Vinted"].map((source, index) => (
          <div key={source} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.025] px-2.5 py-2">
            <span className="text-[9px] font-semibold text-white/75">{source}</span><span className={`h-1.5 w-1.5 rounded-full ${index % 2 === 0 ? "bg-gold" : "bg-sky-300"}`} />
          </div>
        ))}
      </div>
      <p className="text-[8px] text-white/40">Fontes organizadas por região para facilitar o garimpo.</p>
    </div>
  </div>
);

const PricingPreview = () => (
  <div className="overflow-hidden rounded-2xl border border-hero-foreground/10 bg-[#0b1018] shadow-2xl" aria-label="Prévia visual ilustrativa da calculadora e precificação">
    <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/[0.025] px-3 py-2.5">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" /><span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
      <span className="ml-2 truncate text-[9px] font-medium text-white/45">importafacil.app / calculadora-pro</span>
    </div>
    <div className="space-y-3 p-3 sm:p-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-semibold text-white/85"><span className="rounded-lg bg-violet-400/10 p-1.5 text-violet-300"><Calculator className="h-3.5 w-3.5" /></span> Calculadora Pro</div><span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-semibold text-emerald-300"><WalletCards className="h-3 w-3" /> Multimoedas</span></div>
      <div className="space-y-2 rounded-xl border border-white/7 bg-white/[0.025] p-3">
        <div className="flex items-center justify-between text-[9px]"><span className="text-white/45">Moeda de origem</span><span className="font-semibold text-white/75">EUR → BRL</span></div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center justify-between text-[9px]"><span className="text-white/45">Produto + frete estimado</span><span className="font-semibold text-white/75">Simulação</span></div>
        <div className="flex items-center justify-between text-[9px]"><span className="flex items-center gap-1 text-white/45"><Truck className="h-3 w-3" /> Custos internacionais</span><span className="font-semibold text-white/75">Detalhados</span></div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-gold/15 bg-gold/[0.06] px-3 py-2.5"><span className="text-[9px] text-white/60">Estimativa de custo e margem</span><span className="text-[9px] font-bold text-gold">Antes de comprar</span></div>
      <p className="text-[8px] text-white/40">Conversão de moedas e simulador para apoiar sua precificação.</p>
    </div>
  </div>
);

const LandingPage = () => {
  const { user, hasPaid, isAdmin } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPlans = () => scrollToSection("plans-section");
  const scrollToManifesto = () => scrollToSection("quem-somos");

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

      <section className="relative z-10 flex min-h-[86svh] flex-col items-center justify-center px-5 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/90 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Garimpo internacional com mais clareza
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-7xl">
            Importar começa com <span className="text-gold">a oportunidade certa.</span>
            <span className="mt-3 block text-2xl font-semibold leading-tight text-hero-foreground/75 sm:text-3xl lg:text-4xl">
              Conhecimento, ferramentas e fontes globais. Em um só lugar.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-hero-foreground/70 sm:text-base lg:text-lg">
            O ImportaFácil reúne inteligência de garimpo, busca internacional e cálculo de custos para ajudar você a pesquisar e planejar suas importações.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <button onClick={scrollToPlans} className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-bold text-gold-foreground shadow-[0_0_25px_hsl(43_80%_55%_/_0.22)] transition-colors hover:bg-gold/90">Ver planos e preços <ArrowRight className="ml-2 h-4 w-4" /></button>
            <button onClick={scrollToManifesto} className="inline-flex h-12 items-center justify-center rounded-xl border border-hero-foreground/15 px-6 text-sm font-semibold text-hero-foreground/75 transition-colors hover:border-gold/40 hover:text-gold">Como funciona <ChevronDown className="ml-2 h-4 w-4" /></button>
          </div>
          <p className="text-xs text-hero-foreground/45">Veja o valor primeiro. Seus dados só entram quando você decidir continuar.</p>
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
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold/80 sm:text-xs">Quem somos</p>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">Garimpo global, <span className="text-gold">organizado para você.</span></h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-hero-foreground/70 sm:text-base">
            <p><span className="font-semibold text-hero-foreground">ImportaFácil é uma plataforma centralizadora de conhecimento, ferramentas e inteligência de garimpo internacional para importadores.</span></p>
            <p>Em vez de alternar entre guias, planilhas e dezenas de sites sem contexto, você encontra em um só ecossistema recursos para pesquisar produtos, explorar fontes globais e organizar os custos da sua operação.</p>
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
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="group rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.025] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 sm:p-5">
              <ProductPreview />
              <div className="px-1 pb-1 pt-5"><div className="mb-2 flex items-center gap-2"><Brain className="h-4 w-4 text-gold" /><h3 className="text-sm font-bold">IA Lobo das Importações</h3></div><p className="text-xs leading-relaxed text-hero-foreground/60">Análise de produto por foto, busca de marcas e estimativa de margem para apoiar sua avaliação.</p></div>
            </article>
            <article className="group rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.025] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 sm:p-5">
              <SourcesPreview />
              <div className="px-1 pb-1 pt-5"><div className="mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-gold" /><h3 className="text-sm font-bold">Bases &amp; Fontes de Garimpo</h3></div><p className="text-xs leading-relaxed text-hero-foreground/60">Acesso organizado a fontes da China, Europa e EUA, incluindo marketplaces, catálogos de fornecedores, 1688, Taobao e Vinted.</p></div>
            </article>
            <article className="group rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.025] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 sm:p-5">
              <PricingPreview />
              <div className="px-1 pb-1 pt-5"><div className="mb-2 flex items-center gap-2"><Calculator className="h-4 w-4 text-gold" /><h3 className="text-sm font-bold">Calculadora &amp; Precificação</h3></div><p className="text-xs leading-relaxed text-hero-foreground/60">Conversor de moedas e simulador de frete e custos internacionais para planejar a precificação.</p></div>
            </article>
          </div>
          <p className="mt-4 text-center text-[10px] text-hero-foreground/35">A tela inicial é a captura enviada; as prévias de fontes e calculadora permanecem ilustrativas.</p>
        </div>
      </section>

      <section id="plans-section" className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Planos" title="Escolha como quer" accent="começar." description="Do primeiro passo na Vinted ao acompanhamento completo da sua importação." />
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {landingPlans.map((plan) => <LandingPlanCard key={plan.title} plan={plan} />)}
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
              ["Posso começar por um plano menor?", "Sim. Você pode começar pelo acesso ao site ou pelo minicurso e evoluir quando fizer sentido."],
            ].map(([question, answer]) => <article key={question} className="rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-5"><h3 className="text-sm font-bold text-hero-foreground">{question}</h3><p className="mt-2 text-sm leading-relaxed text-hero-foreground/60">{answer}</p></article>)}
          </div>
        </div>
      </section>
    </div>

  );
};

export default LandingPage;
