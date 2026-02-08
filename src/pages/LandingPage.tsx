import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Brain, Globe, Calculator, Headset, Infinity, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user, hasPaid, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (hasPaid || isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, hasPaid, isAdmin, navigate]);

  const scrollToDeliverables = () => {
    document.getElementById("deliverables-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const deliverables = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "IA Especialista em Importação",
      desc: "Nossa inteligência faz o raio-x completo do produto por foto. Analisa se é Original, detalha o material, estima o peso para frete e identifica Collabs.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Busca Global Copia e Cola",
      desc: "Tradução técnica de palavras-chave para você encontrar os melhores produtos nos nossos fornecedores ao redor do mundo.",
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Calculadora Pro",
      desc: "Sistema completo para cálculo de drop, frete e estimativas de alfândega com moedas em tempo real.",
    },
    {
      icon: <Headset className="w-6 h-6" />,
      title: "Suporte VIP",
      desc: "Acesso direto comigo para tirar dúvidas em até 24h-48h.",
    },
    {
      icon: <Infinity className="w-6 h-6" />,
      title: "Acesso Vitalício",
      desc: "Pagamento único, sem mensalidades.",
    },
  ];

  return (
    <div translate="no" className="bg-hero text-hero-foreground">
      {/* ── Hero Section ── */}
      <section className="h-screen flex flex-col items-center justify-start pt-[15vh] sm:pt-[18vh] px-6 text-center relative snap-start">
        {/* Wolf watermark */}
        <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
          <span className="text-[20rem] sm:text-[28rem] opacity-[0.08] select-none leading-none">🐺</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
            Bem-vindo ao{" "}
            <span className="text-gold">ImportaFácil</span>
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-hero-foreground/80">
            Seu guia mais completo sobre importações
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-hero-foreground/70 max-w-3xl mx-auto">
            Domine as importações nos{" "}
            <span className="text-hero-foreground font-semibold">Estados Unidos, China</span> e em toda a{" "}
            <span className="text-hero-foreground font-semibold">Europa</span> com uma estrutura de elite baseada na mentalidade de lucro de{" "}
            <span className="text-gold font-semibold">Jordan Belfort</span>, o Lobo de Wall Street.
          </p>

          <button onClick={scrollToDeliverables} className="mx-auto block animate-bounce text-gold/60 hover:text-gold transition-colors mt-8" aria-label="Rolar para baixo">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* ── O Que Entregamos ── */}
      <section id="deliverables-section" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-10 snap-start">
        <div className="max-w-3xl mx-auto w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
            O Que <span className="text-gold">Entregamos</span>
          </h2>
          <div className="space-y-3">
            {deliverables.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-hero-foreground/5 border border-hero-foreground/10">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold mb-0.5">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-hero-foreground/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-8 text-center space-y-4">
            <Button
              onClick={() => navigate("/login")}
              className="h-14 px-8 text-base sm:text-lg font-bold rounded-2xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-[0_0_30px_hsl(43_80%_55%_/_0.3)] hover:shadow-[0_0_40px_hsl(43_80%_55%_/_0.45)] transition-all duration-300"
            >
              EU QUERO MEU ACESSO VITALÍCIO
            </Button>

            {/* WhatsApp Community Button */}
            <div>
              <a
                href="https://chat.whatsapp.com/IBxNhd45sfF6lNCKIxpe7N"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-hero-foreground/60 hover:text-gold transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Entrar na comunidade
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
