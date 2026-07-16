import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import wolfLogo from "@/assets/wolf-logo-clean.png";
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

const PreSignup = () => {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || whatsapp.replace(/\D/g, "").length < 10 || !email.includes("@") || !reason) {
      toast({
        title: "Preencha todos os campos",
        description: "Nome, WhatsApp válido, e-mail e motivo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Silent capture — never block the user; navigate immediately on failure too.
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
          source: "pre-signup-form",
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
      navigate("/signup", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-strong animate-slide-up border-border/60">
        <div className="flex flex-col items-center mb-6">
          <img src={wolfLogo} alt="ImportaFácil" className="w-16 h-16 rounded-2xl mb-3 shadow-medium" />
          <h1 className="text-2xl font-bold text-foreground text-center">
            Um passo antes do seu acesso
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
            Preencha rapidinho para personalizarmos sua experiência dentro do ecossistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground font-medium">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Como você se chama?"
              autoComplete="name"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-foreground font-medium">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
              placeholder="(11) 9 9999-9999"
              inputMode="tel"
              autoComplete="tel"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Motivo para importar</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-12">
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
            className="w-full h-12 bg-gradient-primary hover:opacity-90 font-semibold text-base gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Avançar para o cadastro <ArrowRight className="w-4 h-4" /></>}
          </Button>

          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>Seus dados são usados apenas para liberar seu acesso e suporte personalizado. Você não sai do site em nenhum momento.</span>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PreSignup;