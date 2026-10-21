import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, MessageCircle, Target, UserRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { backendUrl, backendKey } from "@/lib/backend";

const maskWhatsapp = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 9) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const REASONS = [
  { value: "uso-proprio", label: "Uso próprio" },
  { value: "revenda-marca", label: "Revenda / Marca própria" },
  { value: "fornecedores-vip", label: "Fornecedores VIP" },
  { value: "outros", label: "Outros" },
];

const PreSignup = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const goToPlans = () => {
    if (window.location.pathname === "/") {
      document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/#plans-section");
  };

  const continueToStepTwo = () => {
    if (!fullName.trim() || !email.includes("@")) {
      toast({ title: "Confira seus dados", description: "Informe seu nome e um e-mail válido para continuar.", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || whatsapp.replace(/\D/g, "").length < 10 || !email.includes("@") || !reason) {
      toast({ title: "Preencha os dois campos finais", description: "Informe um WhatsApp válido e escolha seu objetivo para continuar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await fetch(`${backendUrl}/functions/v1/lead-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: backendKey, Authorization: `Bearer ${backendKey}` },
        body: JSON.stringify({ full_name: fullName.trim(), whatsapp: whatsapp.trim(), email: email.trim().toLowerCase(), reason, source: "pre-signup-form", metadata: { ua: typeof navigator !== "undefined" ? navigator.userAgent : "", ref: typeof document !== "undefined" ? document.referrer : "" } }),
      }).catch(() => null);
    } finally {
      sessionStorage.setItem("presignup_lead", JSON.stringify({ fullName, email, whatsapp, reason }));
      navigate("/signup", { replace: true });
    }
  };

  const fieldClass = "h-12 rounded-xl pl-10 focus-visible:ring-gold";

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero p-4 text-hero-foreground">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={wolfLogo} alt="ImportaFácil" className="mb-4 h-16 w-16 rounded-2xl shadow-medium" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Acesso do cliente</p>
          <h1 className="mt-2 text-2xl font-extrabold">Um passo antes do seu acesso</h1>
          <p className="mt-2 text-sm leading-relaxed text-hero-foreground/65">Leva menos de 1 minuto. Você só decide depois de ver os planos.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7" translate="no">
          <div className="flex items-center justify-center gap-2" aria-label={`Passo ${step} de 2`}>
            {[1, 2].map((item) => <span key={item} className={`h-1.5 rounded-full transition-all ${item === step ? "w-10 bg-gold" : "w-5 bg-hero-foreground/20"}`} />)}
            <span className="ml-1 text-[10px] font-semibold text-hero-foreground/50">Passo {step} de 2</span>
          </div>
          <div className="text-center"><h2 className="text-lg font-bold">{step === 1 ? "Comece pelo básico" : "Só mais duas informações"}</h2><p className="mt-1 text-xs text-hero-foreground/60">{step === 1 ? "Assim já deixamos seu cadastro preparado." : "Isso ajuda a personalizar sua experiência."}</p></div>

          {step === 1 ? (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="fullName" className="text-xs font-semibold">Nome completo</Label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como você se chama?" autoComplete="name" className={fieldClass} required /></div></div>
              <div className="space-y-1.5"><Label htmlFor="email" className="text-xs font-semibold">E-mail</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" className={fieldClass} required /></div></div>
              <Button type="button" onClick={continueToStepTwo} className="h-12 w-full gap-2 rounded-xl bg-gold font-bold text-gold-foreground hover:bg-gold/90">Continuar <ArrowRight className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="whatsapp" className="text-xs font-semibold">WhatsApp</Label><div className="relative"><MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} placeholder="(11) 9 9999-9999" inputMode="tel" autoComplete="tel" className={fieldClass} required /></div></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold">O que você quer fazer com a importação?</Label><div className="relative"><Target className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gold/70" /><Select value={reason} onValueChange={setReason}><SelectTrigger className={`${fieldClass} pl-10`}><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger><SelectContent>{REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div></div>
              <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 flex-1 gap-2 rounded-xl border-hero-foreground/20 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"><ArrowLeft className="h-4 w-4" /> Voltar</Button><Button type="submit" disabled={loading} className="h-12 flex-[2] gap-2 rounded-xl bg-gold font-bold text-gold-foreground hover:bg-gold/90">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Avançar para o cadastro <ArrowRight className="h-4 w-4" /></>}</Button></div>
            </div>
          )}

          <button type="button" onClick={goToPlans} className="mx-auto block text-xs font-semibold text-hero-foreground/60 underline decoration-hero-foreground/25 underline-offset-4 transition-colors hover:text-gold">Prefiro ver os planos primeiro</button>
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-hero-foreground/55"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" /><span>Seus dados ficam seguros e chegam à aba de Leads para o administrador entrar em contato pelo WhatsApp.</span></div>
        </form>
      </div>
    </main>
  );
};

export default PreSignup;
