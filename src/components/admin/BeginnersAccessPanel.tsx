import { useState } from "react";
import { Calculator, Mail, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";

interface BeginnersAccessPanelProps {
  onChanged: () => Promise<void>;
}

const BeginnersAccessPanel = ({ onChanged }: BeginnersAccessPanelProps) => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"activate" | "remove" | null>(null);
  const { toast } = useToast();

  const changeAccess = async (enabled: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }
    setBusy(enabled ? "activate" : "remove");
    const supabase = await getSupabaseClient();
    if (!supabase) {
      toast({ title: "Erro", description: "Backend indisponível.", variant: "destructive" });
      setBusy(null);
      return;
    }
    const { error } = await supabase.rpc("admin_set_beginners_access_by_email", {
      _email: normalizedEmail,
      _enabled: enabled,
    });
    if (error) {
      toast({ title: "Não foi possível alterar o Beginners", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: enabled ? "Beginners ativado" : "Beginners removido",
        description: enabled
          ? `${normalizedEmail} agora tem somente a Calculadora Pro por 30 dias.`
          : `O acesso Beginners de ${normalizedEmail} foi removido.`,
      });
      setEmail("");
      await onChanged();
    }
    setBusy(null);
  };

  return (
    <Card className="border-gold/30 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 text-gold" />
          Acesso Beginners
        </CardTitle>
        <CardDescription>
          Libere somente a Calculadora Pro para uma conta existente. A ativação dura 30 dias e não altera usuários Full legados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="beginners-email">E-mail da conta</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="beginners-email"
              type="email"
              autoComplete="email"
              placeholder="cliente@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
              disabled={busy !== null}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void changeAccess(true)} disabled={busy !== null} className="gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
            {busy === "activate" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Ativar Beginners
          </Button>
          <Button onClick={() => void changeAccess(false)} disabled={busy !== null} variant="outline" className="gap-2">
            {busy === "remove" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            Remover Beginners
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O cliente continua podendo entrar e acessar o Perfil. IA, Fontes e as demais áreas continuam bloqueadas.
        </p>
      </CardContent>
    </Card>
  );
};

export default BeginnersAccessPanel;
