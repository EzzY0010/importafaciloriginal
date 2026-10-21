import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const client = await getSupabaseClient();
    if (!client) {
      toast({ title: "Erro", description: "Backend indisponível no momento.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const { error } = await client.auth.updateUser({ password });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Senha atualizada", description: "Sua senha foi atualizada com sucesso." });
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <AuthShell eyebrow="Recuperação de acesso" title="Crie uma nova senha" description="Escolha uma senha segura para voltar a acessar sua conta do ImportaFácil.">
      <form onSubmit={handleSubmit} className="space-y-5 text-foreground">
        <div className="flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-foreground/75">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p>Use pelo menos 6 caracteres e evite uma senha que você já usa em outro serviço.</p>
        </div>
        <PasswordField id="password" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField id="confirmPassword" label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-lg shadow-gold/15 hover:bg-gold/90">
          {isLoading ? "Atualizando..." : "Atualizar senha"}<ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
