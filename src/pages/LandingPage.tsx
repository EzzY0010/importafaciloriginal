import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Calculator, Headset, Infinity, Sparkles, Camera, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import PaymentButton from "@/components/PaymentButton";

const LandingPage = () => {
  const { user, hasPaid, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (hasPaid || isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, hasPaid, isAdmin, navigate]);

  const scrollToPayment = () => {
    document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: <Calculator className="w-7 h-7" />,
      title: "Calculadora Automatizada",
      desc: "Moedas, frete e alfândega sempre atualizados para você nunca errar nos custos.",
    },
    {
      icon: <Headset className="w-7 h-7" />,
      title: "Suporte VIP Direto",
      desc: "Tire suas dúvidas diretamente comigo, com resposta em até 24h a 48h.",
    },
    {
      icon: <Infinity className="w-7 h-7" />,
      title: "Acesso Vitalício",
      desc: "Pague uma única vez e tenha acesso para sempre, sem mensalidades.",
    },
  ];

  return (
    <div translate="no" className="bg-hero text-hero-foreground">
      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(43 80% 55% / 0.06), transparent)"
        }} />

        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border border-gold/30 bg-gold/10 text-gold">
            <Sparkles className="w-4 h-4" />
            Plataforma Exclusiva
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Bem-vindo ao{" "}
            <span className="text-gold">ImportaFácil</span>
            <br />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-hero-foreground/80 mt-2 block">
              Seu guia mais completo sobre importações
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl leading-relaxed text-hero-foreground/70 max-w-2xl mx-auto">
            Domine as importações nos{" "}
            <span className="text-hero-foreground font-semibold">Estados Unidos, China</span> e em toda a{" "}
            <span className="text-hero-foreground font-semibold">Europa</span>.
          </p>

          {/* AI highlights */}
          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-hero-foreground/5 border border-hero-foreground/10">
              <Sparkles className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <p className="text-sm text-hero-foreground/80">
                <span className="font-semibold text-hero-foreground">IA exclusiva</span> focada em Lucro e Marketing, inspirada no Jordan Belfort.
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-hero-foreground/5 border border-hero-foreground/10">
              <Camera className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <p className="text-sm text-hero-foreground/80">
                Envie uma foto e a IA faz o <span className="font-semibold text-hero-foreground">raio-x completo</span>: Original, material, peso e Collabs.
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-hero-foreground/5 border border-hero-foreground/10 sm:col-span-2">
              <Globe className="w-5 h-5 text-gold mt-0.5 shrink-0" />
              <p className="text-sm text-hero-foreground/80">
                Receba as <span className="font-semibold text-hero-foreground">palavras-chave técnicas traduzidas</span> — é só copiar e colar para pesquisar como quem já domina o mercado.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={scrollToPayment}
              className="h-16 px-10 text-lg sm:text-xl font-bold rounded-2xl bg-gold text-gold-foreground hover:bg-gold/90 shadow-[0_0_30px_hsl(43_80%_55%_/_0.3)] hover:shadow-[0_0_40px_hsl(43_80%_55%_/_0.45)] transition-all duration-300"
            >
              EU QUERO MEU ACESSO VITALÍCIO
            </Button>
          </div>

          {/* Animated arrow */}
          <button onClick={scrollToPayment} className="mx-auto block animate-bounce text-gold/60 hover:text-gold transition-colors" aria-label="Rolar para baixo">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14">
            O que você recebe com o <span className="text-gold">ImportaFácil</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4 p-8 rounded-3xl bg-hero-foreground/5 border border-hero-foreground/10 hover:border-gold/30 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-hero-foreground/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment Section ── */}
      <section id="payment-section" className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Garanta seu <span className="text-gold">Acesso Vitalício</span>
          </h2>
          <p className="text-center text-hero-foreground/60 mb-10">
            Pagamento único, sem mensalidades. Acesso para sempre.
          </p>
          <div className="[&_.card]:bg-hero-foreground/5 [&_.card]:border-hero-foreground/10 [&_.card]:text-hero-foreground [&_p]:text-hero-foreground/70 [&_button]:bg-gold [&_button]:text-gold-foreground [&_button]:hover:bg-gold/90 [&_.bg-muted]:bg-hero-foreground/5">
            <PaymentButton />
          </div>

          {/* Login link */}
          <p className="text-center mt-8 text-sm text-hero-foreground/50">
            Já tem uma conta?{" "}
            <a href="/login" className="text-gold hover:underline font-semibold">
              Entrar
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
