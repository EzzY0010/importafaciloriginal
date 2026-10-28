import { useState } from "react";
import { Calculator, Crown, Mail, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
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
  const [busy, setBusy] = useState<"beginners-activate" | "beginners-remove" | "full-activate" | "full-remove" | null>(null);
  const { toast } = useToast();

  const changeAccess = async (tier: "beginners" | "full", enabled: boolean) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }
    setBusy(`${tier}-${enabled ? "activate" : "remove"}` as typeof busy);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      toast({ title: "Erro", description: "Backend indisponível.", variant: "destructive" });
      setBusy(null);
      return;
    }
    const { error } = await supabase.rpc(tier === "beginners" ? "admin_set_beginners_access_by_email" : "admin_set_full_access_by_email", {
      _email: normalizedEmail,
      _enabled: enabled,
    });
    if (error) {
      toast({ title: `Não foi possível alterar o acesso ${tier === "beginners" ? "Beginners" : "Full"}`, description: error.message, variant: "destructive" });
    } else {
      toast({
        title: enabled ? `${tier === "beginners" ? "Beginners" : "Full"} ativado` : `${tier === "beginners" ? "Beginners" : "Full"} removido`,
        description: enabled
          ? tier === "beginners"
            ? `${normalizedEmail} agora tem somente a Calculadora Pro por 30 dias.`
            : `${normalizedEmail} agora tem acesso Full permanente.`
          : `O acesso ${tier === "beginners" ? "Beginners" : "Full"} de ${normalizedEmail} foi removido.`,
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
          Controles de acesso por e-mail
        </CardTitle>
        <CardDescription>
          Use o mesmo e-mail para liberar o Beginners ou o acesso Full. Contas Full existentes ficam protegidas contra rebaixamento acidental.
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
          <Button onClick={() => void changeAccess("beginners", true)} disabled={busy !== null} className="gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
            {busy === "beginners-activate" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Ativar Beginners
          </Button>
          <Button onClick={() => void changeAccess("beginners", false)} disabled={busy !== null} variant="outline" className="gap-2">
            {busy === "beginners-remove" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            Remover Beginners
          </Button>
          <Button onClick={() => void changeAccess("full", true)} disabled={busy !== null} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {busy === "full-activate" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            Ativar Full
          </Button>
          <Button onClick={() => void changeAccess("full", false)} disabled={busy !== null} variant="outline" className="gap-2">
            {busy === "full-remove" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
            Remover Full
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Beginners libera somente a Calculadora por 30 dias. Full libera todo o site permanentemente.
        </p>
      </CardContent>
    </Card>
  );
};

export default BeginnersAccessPanel;
