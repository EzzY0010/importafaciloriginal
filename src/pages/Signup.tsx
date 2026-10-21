import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { translateAuthError } from "@/lib/authErrors";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("presignup_lead");
      if (!raw) return;
      const lead = JSON.parse(raw) as { fullName?: string; email?: string };
      if (lead.fullName && !name) setName(lead.fullName);
      if (lead.email && !email) setEmail(lead.email);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t('error'), description: t('passwordMismatch'), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t('error'), description: t('passwordTooShort'), variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) toast({ title: t('error'), description: translateAuthError(error.message), variant: "destructive" });
    else {
      toast({ title: t('accountCreated'), description: t('welcomeToApp') });
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <AuthShell eyebrow="Primeiro acesso" title="Crie sua conta" description="Tenha seu espaço para acompanhar ferramentas, fontes e decisões de importação com mais clareza.">
      <form onSubmit={handleSubmit} className="space-y-4 text-foreground">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-semibold">{t('fullName')}</Label>
          <Input id="name" type="text" placeholder={t('yourName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className="h-12 rounded-xl focus-visible:ring-gold" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold">{t('email')}</Label>
          <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="h-12 rounded-xl focus-visible:ring-gold" />
        </div>
        <PasswordField id="password" label={t('password')} value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordField id="confirmPassword" label={t('confirmPassword')} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Use pelo menos 6 caracteres.</p>
        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-lg shadow-gold/15 hover:bg-gold/90">
          {isLoading ? "Criando conta..." : t('createAccountBtn')}<ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">{t('hasAccount')} <Link to="/login" className="font-bold text-primary hover:text-primary/75">{t('login')}</Link></p>
    </AuthShell>
  );
};

export default Signup;
