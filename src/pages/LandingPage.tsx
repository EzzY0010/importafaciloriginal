import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Brain, Globe, Calculator, Headset, Gem, Check, X, Crown, Smartphone, MessageCircle, Loader2, ShieldAlert, PackageSearch, CircleDollarSign, Clock3 } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import LeadCaptureInline from "@/components/LeadCaptureInline";
import type { PlanId } from "@/config/plans";
import MinicursoBuyCard from "@/components/MinicursoBuyCard";
import PlatformShowcase from "@/components/PlatformShowcase";
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
import { getPlanCheckoutUrl } from "@/config/checkouts";

type LandingPlan = {
  id: string;
  checkoutPlan: PlanId;
  name: string;
  price: number;
  previousPrice?: number;
  period: string;
  description: string;
  features: string[];
  support?: string;
  highlight?: boolean;
};

const landingPlans: LandingPlan[] = [
  {
    id: "site",
    checkoutPlan: "autonomo",
    name: "Acesso ao Site · Mensal",
    price: 34.99,
    period: "/mês",
    description: "Ferramentas essenciais e fontes principais para garimpar com mais autonomia.",
    features: [
      "IA Especialista em Importação",
      "Busca Global Copia e Cola",
      "Calculadora Pro",
      "Fontes Principais de Garimpo",
      "Acesso ao Grupo do WhatsApp",
      "Suporte para dúvidas da plataforma em até 48h",
    ],
  },
  {
    id: "mentoria-mensal",
    checkoutPlan: "mensal",
    name: "Mentoria · Mensal",
    price: 147.99,
    period: "/mês",
    description: "Todos os recursos do site, com orientação para colocar sua primeira importação em prática.",
    features: [
      "IA Especialista em Importação",
      "Busca Global Copia e Cola",
      "Calculadora Pro",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Acesso ao Grupo do WhatsApp",
    ],
    support: "Suporte prioritário em até 24h",
  },
  {
    id: "mentoria-vip",
    checkoutPlan: "anual",
    name: "Mentoria VIP · Vitalício",
    price: 499,
    previousPrice: 799,
    period: "à vista · pagamento único",
    description: "Acesso para sempre a todos os recursos de mentoria e acompanhamento.",
    features: [
      "Todos os recursos da Mentoria",
      "Mais de 15 Fontes de Garimpo",
      "Acompanhamento na Primeira Importação",
      "Acesso ao Grupo do WhatsApp",
      "Acesso vitalício à plataforma",
    ],
    support: "Suporte prioritário em até 24h",
    highlight: true,
  },
];

const PlanCard = ({ plan }: { plan: LandingPlan }) => (
  <div className={`relative flex flex-col p-5 rounded-2xl border transition-all ${plan.highlight ? "bg-gold/10 border-gold/60 shadow-[0_0_40px_hsl(43_80%_55%_/_0.25)]" : "bg-hero-foreground/5 border-hero-foreground/15 hover:border-gold/40"}`}>
    {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"><Crown className="w-3 h-3" /> Melhor custo-benefício</div>}
    <h3 className="font-bold text-hero-foreground text-base mb-1">{plan.name}</h3>
    <p className="text-xs text-hero-foreground/60 min-h-[32px]">{plan.description}</p>
    <div className="my-4">
      {plan.previousPrice && <p className="text-xs text-hero-foreground/60 line-through">De R$ {plan.previousPrice.toFixed(2).replace('.', ',')}</p>}
      <div className="flex items-baseline gap-1"><span className="text-2xl sm:text-3xl font-extrabold text-gold">R$ {plan.price.toFixed(2).replace(".", ",")}</span></div>
      {plan.previousPrice && <span className="inline-block text-[10px] bg-gold text-gold-foreground rounded-full px-2 py-0.5 mt-1">-{Math.round((1 - plan.price / plan.previousPrice) * 100)}%</span>}
      <span className="mt-1 block text-[11px] text-hero-foreground/60">{plan.period}</span>
    </div>
    <ul className="space-y-1.5 mb-4 flex-1">
      {plan.features.map((feature) => {
        const excluded = feature.startsWith("Sem ");
        return <li key={feature} className={`flex items-start gap-2 text-[11px] ${excluded ? "text-hero-foreground/50" : "text-hero-foreground/80"}`}>
          {excluded ? <X className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" /> : <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />} {feature}
        </li>;
      })}
      {plan.support && <li className="flex items-start gap-2 text-[11px] font-semibold text-hero-foreground"><Headset className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" /> {plan.support}</li>}
    </ul>
    <Button asChild className={`w-full min-h-11 h-auto py-2.5 font-bold whitespace-normal leading-tight text-xs sm:text-sm ${plan.highlight ? "bg-gold text-gold-foreground hover:bg-gold/90" : "bg-hero-foreground/10 text-hero-foreground hover:bg-hero-foreground/20"}`}>
      <a href={getPlanCheckoutUrl(plan.checkoutPlan)}>Escolher plano</a>
    </Button>
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
    document.getElementById("manifesto-section")?.scrollIntoView({ behavior: "smooth" });
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


  const deliverables = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "🧠 IA Especialista em Importação",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Pesquise com mais informação antes de decidir.</span> A IA ajuda a analisar produtos por foto, buscar referências de marcas e estimar peso e margem. Use esses dados como apoio à sua avaliação de fornecedores e oportunidades.
        </>
      ),
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "🌐 Busca Global Copia e Cola",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">O idioma não é mais uma barreira.</span> Tenha acesso à tradução técnica de palavras-chave para encontrar os <span className="font-semibold text-hero-foreground">produtos mais lucrativos e escondidos</span> direto nos nossos fornecedores ao redor do mundo.
        </>
      ),
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "🧮 Calculadora Pro",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Previsibilidade é o segredo do lucro.</span> Um sistema completo para cálculo de Drop, frete e estimativas reais de alfândega com <span className="font-semibold text-hero-foreground">conversão de moedas em tempo real</span>. Saiba exatamente a sua margem antes de gastar um único centavo.
        </>
      ),
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: "🌍 Acesso às Fontes Globais",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Pesquise em diferentes mercados.</span> Acesse fontes de garimpo da <span className="font-semibold text-hero-foreground">China, Europa e Estados Unidos</span>, organizadas para ajudar você a encontrar produtos e fornecedores — com acesso ampliado conforme o plano.
        </>
      ),
    },
    {
      icon: <Headset className="w-6 h-6" />,
      title: "🎧 Acompanhamento & Suporte VIP",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Você nunca estará sozinho.</span> Receba <span className="font-semibold text-hero-foreground">acompanhamento na sua primeira importação</span>, do pedido até a chegada, e conte com <span className="font-semibold text-hero-foreground">suporte para dúvidas de acordo com o seu plano</span>, além de fazer networking com outros importadores no nosso <span className="font-semibold text-gold">grupo exclusivo do WhatsApp</span>.
        </>
      ),
    },
  ];

  const offerItems = [
    "Ecossistema Completo (EUA, China, Europa, Reino Unido e Dubai)",
    "IA Especialista + Calculadora Pro + Busca Global",
    "Mais de 15 Fontes Secretas de Garimpo",
    "Grupo no WhatsApp + Suporte VIP",
  ];

  const marketProblems = [
    { icon: <ShieldAlert className="h-5 w-5" />, title: "Medo de golpes", text: "Dificuldade para avaliar vendedores, produtos e sinais de risco antes de comprar." },
    { icon: <PackageSearch className="h-5 w-5" />, title: "Fornecedores ruins", text: "Tempo perdido procurando fontes confiáveis em vários países e plataformas." },
    { icon: <CircleDollarSign className="h-5 w-5" />, title: "Taxas surpresa", text: "Custos de frete, câmbio e importação que aparecem tarde demais no processo." },
    { icon: <Calculator className="h-5 w-5" />, title: "Margem no escuro", text: "Falta de ferramentas simples para estimar o custo final e o lucro antes do pedido." },
    { icon: <Clock3 className="h-5 w-5" />, title: "Processos manuais", text: "Traduções, buscas e cálculos repetitivos que consomem tempo e geram erros." },
  ];

  const anchorItems = [
    { label: "Quem Somos", target: "manifesto-section" },
    { label: "O Que Resolvemos", target: "problem-section" },
    { label: "O Que Entregamos", target: "deliverables-section" },
    { label: "Por Dentro", target: "inside-section" },
    { label: "Planos", target: "plans-section" },
  ];

  const scrollToSection = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div translate="no" className="bg-hero text-hero-foreground">
      {/* Wolf watermark - fixed across all sections */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img src={wolfLogo} alt="" className="w-[60vw] sm:w-[40vw] max-w-[500px] opacity-[0.08] select-none" />
      </div>

      {/* ── 1. Hero / Dobra Principal ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative z-10 py-16 snap-start">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
            Bem-vindo ao <span className="text-gold">ImportaFácil</span>
            <span className="block mt-3 text-2xl sm:text-3xl lg:text-4xl">
              A <span className="text-gold">Estrutura de Elite</span> para Dominar o Mundo das Importações
            </span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-hero-foreground/80 max-w-3xl mx-auto">
            <span className="font-bold text-hero-foreground">Não compre cursos picados.</span> Descubra o guia mais completo sobre importações que une{" "}
            <span className="text-hero-foreground font-semibold">Estados Unidos, China e Europa</span> em um só ecossistema, desenhado sob a mentalidade de lucro de{" "}
            <span className="text-gold font-semibold">Jordan Belfort</span>, o Lobo de Wall Street.
          </p>

          {/* Inline lead capture form */}
          <div className="pt-4">
            <LeadCaptureInline scrollToPlansId="plans-section" />
          </div>

          <button onClick={scrollToManifesto} className="mx-auto block animate-bounce text-gold/60 hover:text-gold transition-colors mt-8" aria-label="Rolar para baixo">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      <nav aria-label="Navegação da landing page" className="sticky top-3 z-30 mx-auto max-w-6xl px-3">
        <div className="pointer-events-auto mx-auto flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-full border border-hero-foreground/15 bg-hero/90 p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl sm:gap-2 sm:p-2">
          {anchorItems.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="shrink-0 rounded-full border border-hero-foreground/10 bg-hero-foreground/[0.04] px-4 py-2 text-xs font-semibold text-hero-foreground/75 transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── 2. O Manifesto do Lobo ── */}
      <section id="manifesto-section" className="scroll-mt-20 flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="text-center mb-6">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Conheça a plataforma</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Quem <span className="text-gold">Somos</span>
            </h2>
          </div>
          <p className="text-center text-sm leading-relaxed text-hero-foreground/75 sm:text-base">
            O <span className="font-bold text-gold">ImportaFácil</span> é uma plataforma que centraliza conhecimento, ferramentas e inteligência de garimpo internacional para importadores. Reunimos recursos para pesquisar oportunidades, comparar custos e tomar decisões com mais informação — em um só lugar.
          </p>
          <div className="grid gap-3 pt-3 sm:grid-cols-3">
            {[["Conhecimento", "Conteúdo para orientar cada etapa da pesquisa."], ["Ferramentas", "Recursos práticos para agilizar seu processo."], ["Inteligência global", "Fontes e referências para garimpar além das fronteiras."]].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-4 text-center">
                <p className="text-sm font-bold text-gold">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-hero-foreground/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. O Problema do Mercado ── */}
      <section id="problem-section" className="scroll-mt-20 flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="mx-auto w-full max-w-5xl space-y-7">
          <div className="mb-4 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/80 sm:text-sm">Os desafios de quem importa</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              O Que <span className="text-gold">Resolvemos</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-hero-foreground/65">A importação não precisa ser um processo baseado em tentativa e erro.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {marketProblems.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-4 transition-colors hover:border-red-300/25">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-200">{item.icon}</span>
                <span>
                  <span className="block text-sm font-bold text-hero-foreground">{item.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-hero-foreground/60">{item.text}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-gold/25 bg-gold/[0.07] p-5 sm:items-center">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold sm:mt-0" />
            <p className="text-sm leading-relaxed text-hero-foreground/80"><span className="font-bold text-gold">Uma estrutura integrada:</span> pesquisa, ferramentas e conhecimento reunidos para ajudar você a decidir com mais clareza em cada etapa.</p>
          </div>
        </div>
      </section>

      {/* ── 4. O Que Entregamos ── */}
      <section id="deliverables-section" className="scroll-mt-20 flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Os Pilares do Seu Sucesso</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              O Que <span className="text-gold">Entregamos</span>
            </h2>
          </div>
          <div className="space-y-3">
            {deliverables.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-hero-foreground/5 border border-hero-foreground/10 hover:border-gold/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold mb-1.5">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-hero-foreground/75 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="inside-section" className="scroll-mt-20 flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold/80 sm:text-sm">Explore o ecossistema</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Por Dentro <span className="text-gold">do Site</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-hero-foreground/65">Conheça algumas das ferramentas reunidas para apoiar sua pesquisa e planejamento de importação.</p>
          </div>
          <PlatformShowcase />
        </div>
      </section>

      {/* ── 5. Oferta Irrecusável ── */}
      <section className="flex flex-col items-center justify-center px-4 sm:px-6 py-12 snap-start relative z-10">
        <div className="max-w-2xl mx-auto w-full space-y-6 text-center">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Ancoragem de Valor</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Um ecossistema <span className="text-gold">à sua medida</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            Escolha a forma de acesso que combina com seu momento: minicurso, plano mensal ou mentoria com acompanhamento.
          </p>

          <div className="p-5 sm:p-6 rounded-2xl bg-hero-foreground/5 border border-gold/30 text-left space-y-3">
            {offerItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-hero-foreground/90 font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              onClick={scrollToPlans}
              className="h-auto py-4 px-8 text-base sm:text-lg font-extrabold rounded-2xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-[0_0_30px_hsl(43_80%_55%_/_0.3)] hover:shadow-[0_0_40px_hsl(43_80%_55%_/_0.45)] transition-all duration-300 whitespace-normal animate-pulse-glow"
            >
              🎯 VER PLANOS E ESCOLHER O MEU
            </Button>
          </div>
        </div>
      </section>

      {/* ── 6. Planos de Pagamento ── */}
      <section id="plans-section" className="scroll-mt-20 flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Escolha seu plano</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Planos <span className="text-gold">Sob Medida</span>
            </h2>
            <p className="text-sm sm:text-base text-hero-foreground/70 mt-2 max-w-2xl mx-auto">
              Comece pelo conteúdo focado na Vinted, use as ferramentas do site ou escolha um plano com mentoria.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MinicursoBuyCard variant="hero" />
            {landingPlans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
          </div>

          <p className="text-center text-xs text-hero-foreground/60">
            Pagamento seguro · Sem taxas escondidas
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
