import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { backendUrl, backendKey } from "@/lib/backend";

const maskWhatsapp = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 9)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const REASONS = [
  { value: "uso-proprio", label: "Uso próprio" },
  { value: "revenda-marca", label: "Revenda / Marca própria" },
  { value: "fornecedores-vip", label: "Fornecedores VIP" },
  { value: "outros", label: "Outros" },
];

const LeadCaptureInline = ({ scrollToPlansId }: { scrollToPlansId?: string }) => {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      whatsapp.replace(/\D/g, "").length < 10 ||
      !email.includes("@") ||
      !reason
    ) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome, WhatsApp válido, e-mail e motivo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await fetch(`${backendUrl}/functions/v1/lead-capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: backendKey,
          Authorization: `Bearer ${backendKey}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim().toLowerCase(),
          reason,
          source: "landing-inline",
          metadata: {
            ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
            ref: typeof document !== "undefined" ? document.referrer : "",
          },
        }),
      }).catch(() => null);
    } finally {
      sessionStorage.setItem(
        "presignup_lead",
        JSON.stringify({ fullName, email, whatsapp, reason }),
      );
      setLoading(false);
      toast({ title: "Perfeito! Bora escolher seu plano 🐺" });
      if (scrollToPlansId) {
        document.getElementById(scrollToPlansId)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/signup");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto bg-hero-foreground/5 backdrop-blur-sm border border-gold/30 rounded-2xl p-5 sm:p-6 space-y-3 text-left"
      translate="no"
    >
      <div className="text-center mb-2">
        <p className="text-xs uppercase tracking-widest text-gold font-semibold">
          Comece agora — sem sair do site
        </p>
        <h3 className="text-lg sm:text-xl font-bold text-hero-foreground mt-1">
          Preencha e libere seu acesso
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lc-name" className="text-hero-foreground/90 text-xs font-medium">Nome completo</Label>
          <Input
            id="lc-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Como você se chama?"
            autoComplete="name"
            className="h-11 bg-hero-foreground/10 border-hero-foreground/20 text-hero-foreground placeholder:text-hero-foreground/40"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lc-wpp" className="text-hero-foreground/90 text-xs font-medium">WhatsApp</Label>
          <Input
            id="lc-wpp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
            placeholder="(11) 9 9999-9999"
            inputMode="tel"
            autoComplete="tel"
            className="h-11 bg-hero-foreground/10 border-hero-foreground/20 text-hero-foreground placeholder:text-hero-foreground/40"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lc-email" className="text-hero-foreground/90 text-xs font-medium">E-mail</Label>
        <Input
          id="lc-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="email"
          className="h-11 bg-hero-foreground/10 border-hero-foreground/20 text-hero-foreground placeholder:text-hero-foreground/40"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-hero-foreground/90 text-xs font-medium">Motivo para importar</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="h-11 bg-hero-foreground/10 border-hero-foreground/20 text-hero-foreground">
            <SelectValue placeholder="Selecione o seu objetivo" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base gap-2 shadow-[0_0_25px_hsl(43_80%_55%_/_0.3)]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>Continuar para os planos <ArrowRight className="w-4 h-4" /></>
        )}
      </Button>

      <div className="flex items-start gap-2 text-[11px] text-hero-foreground/60">
        <ShieldCheck className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
        <span>Seus dados ficam salvos no nosso painel para liberar seu acesso e dar suporte VIP.</span>
      </div>
    </form>
  );
};

export default LeadCaptureInline;