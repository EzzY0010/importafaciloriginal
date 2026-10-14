import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  MessageCircle,
  PackageSearch,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import homeScreenPreview from "@/assets/importafacil-home-preview.webp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import LeadCaptureInline from "@/components/LeadCaptureInline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import { CN_PAY_CHECKOUTS, getPlanCheckoutUrl } from "@/config/checkouts";

type LandingPlan = {
  title: string;
  description: string;
  price: string;
  period: string;
  previousPrice?: string;
  priceNote?: string;
  badge?: string;
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
    description: "Ferramentas da plataforma com acompanhamento mais próximo.",
    price: "147,99",
    period: "/mês",
    priceNote: "Valor atualizado de R$ 97,00 para R$ 147,99/mês",
    checkoutUrl: getPlanCheckoutUrl("mensal"),
    features: [
      "Todos os recursos do plano Site",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Suporte Prioritário em até 24h",
    ],
    icon: <Headset className="h-5 w-5" />,
  },
  {
    title: "Mentoria VIP Vitalícia",
    description: "Todos os recursos da mentoria, com acesso para sempre.",
    price: "499,00",
    period: "à vista · pagamento único",
    previousPrice: "799,00",
    badge: "Melhor custo-benefício",
    checkoutUrl: getPlanCheckoutUrl("anual"),
    features: [
      "Todos os recursos de mentoria",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Suporte Prioritário em até 24h",
      "Acesso vitalício: para sempre",
    ],
    featured: true,
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
      className={`mt-auto h-11 w-full rounded-xl font-bold ${plan.featured ? "bg-gold text-gold-foreground hover:bg-gold/90" : "bg-hero-foreground/10 text-hero-foreground hover:bg-hero-foreground/15"}`}
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
        {["DHgate", "Yupoo", "Xianyu", "1688", "Taobao", "Vinted"].map((source, index) => (
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

  const [virtualService, setVirtualService] = useState<"Vinted" | "Depop" | "">("");
  const [virtualCountry, setVirtualCountry] = useState("");
  const [virtualPayLoading, setVirtualPayLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && (hasPaid || isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, hasPaid, isAdmin, navigate]);

  const scrollToManifesto = () => {
    document.getElementById("quem-somos")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToPlans = () => {
    document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const virtualCountryOptions: Record<string, string[]> = {
    Vinted: ["Espanha", "Reino Unido", "Portugal"],
    Depop: ["EUA"],
  };

  const VIRTUAL_NUMBER_PRICE = 12.0;

  const handleVirtualNumberPayment = async () => {
    if (!virtualService || !virtualCountry || virtualPayLoading) return;
    setVirtualPayLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error("Backend indisponível");

      const { data: { session } } = await client.auth.getSession();

      const { data, error } = await client.functions.invoke("virtual-number-payment", {
        body: { service: virtualService, country: virtualCountry },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento indisponível");
      window.location.href = url;
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      setVirtualPayLoading(false);
    }
  };

  const handleServiceChange = (value: string) => {
    setVirtualService(value as "Vinted" | "Depop");
    setVirtualCountry("");
  };

  const openWhatsAppGroup = () => {
    window.open("https://chat.whatsapp.com/FISWT8vu8SX8RqymoUirJZ?s=cl&p=a&mlu=4&ilr=4", "_blank", "noopener,noreferrer");
  };


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
          <div className="mx-auto max-w-md pt-2 text-left">
            <LeadCaptureInline scrollToPlansId="plans-section" />
          </div>
          <button onClick={scrollToManifesto} className="mx-auto flex items-center gap-2 pt-3 text-xs font-medium text-hero-foreground/50 transition-colors hover:text-gold" aria-label="Conheça o ImportaFácil">
            Conheça a plataforma <ChevronDown className="h-4 w-4 animate-bounce text-gold" />
          </button>
        </div>
      </section>

      <nav id="section-navigation" aria-label="Navegação da landing page" className="sticky top-0 z-30 border-y border-hero-foreground/10 bg-hero/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 scrollbar-thin sm:justify-center sm:px-6">
          {[
            ["Quem Somos", "#quem-somos"],
            ["O Que Resolvemos", "#o-que-resolvemos"],
            ["O Que Entregamos", "#o-que-entregamos"],
            ["Por Dentro", "#por-dentro"],
            ["Planos", "#plans-section"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="shrink-0 rounded-full border border-hero-foreground/10 bg-hero-foreground/[0.035] px-4 py-2 text-xs font-semibold text-hero-foreground/70 transition-all hover:border-gold/40 hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
              {label}
            </a>
          ))}
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
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300">{problem.icon}</span>
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
              <div className="px-1 pb-1 pt-5"><div className="mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-gold" /><h3 className="text-sm font-bold">Bases &amp; Fontes de Garimpo</h3></div><p className="text-xs leading-relaxed text-hero-foreground/60">Acesso organizado a fontes da China, Europa e EUA, incluindo DHgate, Yupoo, Xianyu, 1688, Taobao e Vinted.</p></div>
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
          <p className="mx-auto mt-6 max-w-3xl text-center text-[10px] leading-relaxed text-hero-foreground/40">
            As opções e os valores exibidos nesta página são informativos. Os links de checkout continuam apontando para a configuração atual da plataforma.
          </p>
        </div>
      </section>

      {/* ── 7. Números Virtuais SMS & Grupo VIP ── */}
      <section className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 snap-start relative z-10">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Mais Ferramentas</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Números Virtuais & <span className="text-gold">Comunidade VIP</span>
            </h2>
            <p className="text-sm sm:text-base text-hero-foreground/70 mt-2 max-w-2xl mx-auto">
              Tudo que você precisa para validar contas internacionais e trocar experiência com outros importadores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Virtual Number Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-hero-foreground/5 border border-hero-foreground/15 hover:border-gold/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-hero-foreground mb-2">Números Virtuais SMS</h3>
              <p className="text-sm text-hero-foreground/75 leading-relaxed mb-5 flex-1">
                Gere números virtuais para verificar contas na Vinted, Depop e outras plataformas do exterior sem expor seu número pessoal.
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 font-bold h-auto py-3 rounded-xl">
                    Gerar Número Virtual
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-hero border-hero-foreground/15 text-hero-foreground sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-hero-foreground">Solicitar Número Virtual</DialogTitle>
                    <DialogDescription className="text-hero-foreground/60">
                      Escolha o serviço e o país, pague e receba o número direto no WhatsApp.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label className="text-hero-foreground">Serviço</Label>
                      <Select value={virtualService} onValueChange={handleServiceChange}>
                        <SelectTrigger className="bg-hero-foreground/5 border-hero-foreground/15 text-hero-foreground">
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent className="bg-hero border-hero-foreground/15 text-hero-foreground">
                          <SelectItem value="Vinted">Vinted</SelectItem>
                          <SelectItem value="Depop">Depop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-hero-foreground">País</Label>
                      <Select value={virtualCountry} onValueChange={setVirtualCountry} disabled={!virtualService}>
                        <SelectTrigger className="bg-hero-foreground/5 border-hero-foreground/15 text-hero-foreground">
                          <SelectValue placeholder={virtualService ? "Selecione o país" : "Escolha um serviço primeiro"} />
                        </SelectTrigger>
                        <SelectContent className="bg-hero border-hero-foreground/15 text-hero-foreground">
                          {virtualService &&
                            virtualCountryOptions[virtualService].map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-xl bg-hero-foreground/5 border border-hero-foreground/10 p-4 text-center">
                    <p className="text-xs text-hero-foreground/60 mb-1">Valor único por número</p>
                    <p className="text-3xl font-extrabold text-gold">
                      R$ {VIRTUAL_NUMBER_PRICE.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <Button
                    onClick={handleVirtualNumberPayment}
                    disabled={!virtualService || !virtualCountry || virtualPayLoading}
                    className="w-full bg-green-600 text-white hover:bg-green-700 font-bold py-3 h-auto rounded-xl shadow-lg"
                  >
                    {virtualPayLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Pagar R$ ${VIRTUAL_NUMBER_PRICE.toFixed(2).replace(".", ",")} e Gerar Número`
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-hero-foreground/50">
                    Pagamento seguro via Mercado Pago. Após a confirmação, você cai direto no nosso WhatsApp com o pedido pronto.
                  </p>
                </DialogContent>
              </Dialog>
            </div>

            {/* Free WhatsApp Group Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-green-950/30 border border-green-500/30 hover:border-green-500/50 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400 mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-hero-foreground mb-2">Grupo Gratuito VIP</h3>
              <p className="text-sm text-hero-foreground/75 leading-relaxed mb-5 flex-1">
                Entre no nosso grupo exclusivo do WhatsApp para receber dicas, novidades e fazer networking com a comunidade de importadores.
              </p>
              <Button
                onClick={openWhatsAppGroup}
                className="w-full bg-green-600 text-white hover:bg-green-700 font-bold h-auto py-3 rounded-xl shadow-[0_0_20px_hsl(142_76%_36%_/_0.3)] hover:shadow-[0_0_30px_hsl(142_76%_36%_/_0.45)] transition-all"
              >
                💬 Entrar no Grupo Gratuito VIP
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>

  );
};

export default LandingPage;
