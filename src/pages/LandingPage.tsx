import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Brain, Globe, Calculator, Headset, Infinity, Gem, Check, Crown } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import LeadCaptureInline from "@/components/LeadCaptureInline";
import { PLANS } from "@/config/plans";

const LandingPage = () => {
  const { user, hasPaid, isAdmin } = useAuth();
  const navigate = useNavigate();

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

  const goToPlan = (planId: string) => {
    // If already logged in, go straight to dashboard payment area
    if (user) {
      navigate(`/dashboard?plan=${planId}`);
      return;
    }
    sessionStorage.setItem("selected_plan", planId);
    navigate("/signup");
  };

  const deliverables = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "🧠 IA Especialista em Importação",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Chega de cair em golpes ou comprar réplicas baratas.</span> Nossa inteligência artificial faz um <span className="font-semibold text-hero-foreground">raio-x completo do produto através de uma foto</span>. Ela analisa a originalidade, detalha o material, estima o peso para o frete e identifica Collabs exclusivas para você <span className="font-semibold text-gold">errar zero vezes</span>.
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
      title: "💎 Mais de 7 Fontes de Garimpo",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Não fique preso apenas a roupas.</span> Te damos o caminho das pedras com <span className="font-semibold text-gold">mais de 7 fontes secretas de garimpo</span> para você encontrar os itens mais desejados e exclusivos do mercado global.
        </>
      ),
    },
    {
      icon: <Headset className="w-6 h-6" />,
      title: "🎧 Suporte VIP & Grupo de Elite",
      desc: (
        <>
          <span className="font-bold text-hero-foreground">Você nunca estará sozinho.</span> Tenha acesso direto comigo e com nossa equipe para tirar qualquer dúvida em até <span className="font-semibold text-hero-foreground">24h-48h</span>, além de fazer networking com outros importadores no nosso <span className="font-semibold text-gold">grupo exclusivo do WhatsApp</span>.
        </>
      ),
    },
  ];

  const offerItems = [
    "Ecossistema Completo (EUA, China e Europa)",
    "IA Especialista + Calculadora Pro + Busca Global",
    "7 Fontes Secretas de Garimpo",
    "Grupo no WhatsApp + Suporte VIP",
  ];

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

      {/* ── 2. O Manifesto do Lobo ── */}
      <section id="manifesto-section" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          <div className="text-center mb-6">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">O Manifesto do Lobo</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              A <span className="text-gold">Mentalidade de Lucro</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            O sucesso pertence a quem prefere <span className="font-bold text-hero-foreground">praticidade e facilidade</span>, em vez de ficar colecionando vários cursos baratos que não saem do lugar.
          </p>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            <span className="font-bold text-gold">Jordan Belfort</span>, o verdadeiro Lobo de Wall Street, não construiu seu império aceitando métodos incompletos ou ferramentas pela metade. Ele trabalhava de forma inteligente para chegar onde queria muito mais rápido — e você também pode, <span className="font-semibold text-hero-foreground">centralizando o seu conhecimento sobre importação</span>.
          </p>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            A maioria dos "gurus" por aí tenta te vender o conhecimento em partes: um curso só para Europa, outro só para Estados Unidos, outro só para China. <span className="font-bold text-hero-foreground">Isso não é estratégia, é perda de tempo e de dinheiro.</span>
          </p>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            O <span className="font-bold text-gold">ImportaFácil</span> nasceu sob essa mesma premissa: <span className="font-semibold text-hero-foreground">centralizar o poder</span>. Nós criamos um ecossistema completo onde você domina os <span className="font-semibold text-hero-foreground">três maiores polos de importação do mundo</span> de forma cirúrgica, sem precisar de mais nenhum outro treinamento.
          </p>
        </div>
      </section>

      {/* ── 3. O Problema do Mercado ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="text-center mb-4">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">A Quebra de Objeção</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              O Problema do <span className="text-gold">Mercado</span>
            </h2>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-destructive/10 border border-destructive/30">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-hero-foreground">❌ O erro comum</h3>
            <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
              Gastar <span className="font-bold">centenas de reais</span> comprando 3 ou 4 cursos diferentes para tentar aprender a importar de lugares diferentes.
            </p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-gold/10 border border-gold/30">
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gold">✅ A nossa solução</h3>
            <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
              Uma <span className="font-bold text-hero-foreground">plataforma única, do básico ao avançado</span>. Você aprende a encontrar, validar e lucrar com produtos do mundo inteiro, com <span className="font-semibold text-hero-foreground">ferramentas automatizadas</span> que aceleram o seu resultado.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. O Que Entregamos ── */}
      <section id="deliverables-section" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
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

      {/* ── 5. Oferta Irrecusável ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-2xl mx-auto w-full space-y-6 text-center">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Ancoragem de Valor</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Oferta <span className="text-gold">Irrecusável</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-hero-foreground/85 leading-relaxed">
            Você <span className="font-bold text-hero-foreground">não vai pagar uma assinatura mensal</span> para ter acesso a tudo isso. Nós acreditamos na <span className="font-semibold text-gold">liberdade de escala</span>.
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
      <section id="plans-section" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-16 snap-start relative z-10">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-gold/80 font-semibold mb-2">Escolha seu plano</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Planos <span className="text-gold">Sob Medida</span>
            </h2>
            <p className="text-sm sm:text-base text-hero-foreground/70 mt-2 max-w-2xl mx-auto">
              Do teste inicial ao acesso definitivo. Quatro caminhos, um único ecossistema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col p-5 rounded-2xl border transition-all ${
                  plan.highlight
                    ? "bg-gold/10 border-gold/60 shadow-[0_0_40px_hsl(43_80%_55%_/_0.25)] scale-[1.02]"
                    : "bg-hero-foreground/5 border-hero-foreground/15 hover:border-gold/40"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Mais escolhido
                  </div>
                )}
                <h3 className="font-bold text-hero-foreground text-base mb-1">{plan.name}</h3>
                <p className="text-xs text-hero-foreground/60 min-h-[32px]">{plan.description}</p>
                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-gold">
                      R$ {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="text-[11px] text-hero-foreground/60">{plan.period}</span>
                </div>
                <Button
                  onClick={() => goToPlan(plan.id)}
                  className={`w-full h-11 font-bold ${
                    plan.highlight
                      ? "bg-gold text-gold-foreground hover:bg-gold/90"
                      : "bg-hero-foreground/10 text-hero-foreground hover:bg-hero-foreground/20"
                  }`}
                >
                  {plan.highlight ? "🎯 Eu quero meu acesso vitalício" : "Escolher"}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-hero-foreground/60">
            Pagamento seguro via Mercado Pago · Sem taxas escondidas
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
