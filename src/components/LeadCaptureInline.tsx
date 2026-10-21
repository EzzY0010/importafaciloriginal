import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, MessageCircle, Target, UserRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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

const LeadCaptureInline = ({ scrollToPlansId }: { scrollToPlansId?: string }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const goToPlans = () => {
    const target = document.getElementById(scrollToPlansId || "plans-section");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    let saved = false;
    let saveError = "";
    try {
      const res = await fetch(`${backendUrl}/functions/v1/lead-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: backendKey, Authorization: `Bearer ${backendKey}` },
        body: JSON.stringify({
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim().toLowerCase(),
          reason,
          source: "landing-inline",
          metadata: { ua: typeof navigator !== "undefined" ? navigator.userAgent : "", ref: typeof document !== "undefined" ? document.referrer : "" },
        }),
      });
      if (res.ok) saved = true;
      else {
        const body = await res.json().catch(() => ({}));
        saveError = body?.error || `Erro ${res.status}`;
        console.error("[lead-capture] falha ao salvar", res.status, body);
      }
    } catch (err) {
      saveError = (err as Error)?.message || "Falha de rede";
      console.error("[lead-capture] erro de rede", err);
    } finally {
      sessionStorage.setItem("presignup_lead", JSON.stringify({ fullName, email, whatsapp, reason }));
      setLoading(false);
      if (saved) toast({ title: "Perfeito! Bora escolher seu plano 🐺" });
      else toast({ title: "Não conseguimos salvar seus dados", description: `${saveError}. Você pode continuar, mas tente reenviar depois.`, variant: "destructive" });
      if (scrollToPlansId) goToPlans();
      else navigate("/signup");
    }
  };

  const fieldClass = "h-11 rounded-xl bg-hero-foreground/10 border-hero-foreground/15 pl-10 text-hero-foreground placeholder:text-hero-foreground/40 focus-visible:ring-gold";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-gold/25 bg-hero-foreground/[0.045] p-5 text-left shadow-xl shadow-black/10 backdrop-blur-sm sm:p-6" translate="no">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Comece agora — sem sair do site</p>
        <h3 className="mt-2 text-lg font-bold text-hero-foreground sm:text-xl">{step === 1 ? "Comece pelo básico" : "Só mais duas informações"}</h3>
        <p className="mt-2 text-xs leading-relaxed text-hero-foreground/65">Leva menos de 1 minuto. Você só decide depois de ver os planos.</p>
        <div className="mt-4 flex items-center justify-center gap-2" aria-label={`Passo ${step} de 2`}>
          {[1, 2].map((item) => <span key={item} className={`h-1.5 rounded-full transition-all ${item === step ? "w-10 bg-gold" : "w-5 bg-hero-foreground/20"}`} />)}
          <span className="ml-1 text-[10px] font-semibold text-hero-foreground/50">Passo {step} de 2</span>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lc-name" className="text-xs font-semibold text-hero-foreground/85">Nome completo</Label>
            <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="lc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Como você se chama?" autoComplete="name" className={fieldClass} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-email" className="text-xs font-semibold text-hero-foreground/85">E-mail</Label>
            <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="lc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" className={fieldClass} required /></div>
          </div>
          <Button type="button" onClick={continueToStepTwo} className="h-12 w-full gap-2 rounded-xl bg-gold font-bold text-gold-foreground shadow-[0_0_25px_hsl(43_80%_55%_/_0.25)] hover:bg-gold/90">Continuar <ArrowRight className="h-4 w-4" /></Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lc-wpp" className="text-xs font-semibold text-hero-foreground/85">WhatsApp</Label>
            <div className="relative"><MessageCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" /><Input id="lc-wpp" value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} placeholder="(11) 9 9999-9999" inputMode="tel" autoComplete="tel" className={fieldClass} required /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-hero-foreground/85">O que você quer fazer com a importação?</Label>
            <div className="relative"><Target className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gold/70" /><Select value={reason} onValueChange={setReason}><SelectTrigger className={`${fieldClass} pl-10`}><SelectValue placeholder="Selecione seu objetivo" /></SelectTrigger><SelectContent>{REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 flex-1 gap-2 rounded-xl border-hero-foreground/20 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
            <Button type="submit" disabled={loading} className="h-12 flex-[2] gap-2 rounded-xl bg-gold font-bold text-gold-foreground hover:bg-gold/90">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Ver planos <ArrowRight className="h-4 w-4" /></>}</Button>
          </div>
        </div>
      )}

      <button type="button" onClick={goToPlans} className="mx-auto block text-xs font-semibold text-hero-foreground/60 underline decoration-hero-foreground/25 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold">Prefiro ver os planos primeiro</button>
      <div className="flex items-start gap-2 text-[11px] leading-relaxed text-hero-foreground/55"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" /><span>Seus dados ficam seguros e chegam à aba de Leads para nosso administrador entrar em contato pelo WhatsApp.</span></div>
    </form>
  );
};

export default LeadCaptureInline;
