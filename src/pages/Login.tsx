import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { backendKey, backendUrl, getSupabaseClient } from "@/lib/backend";
import { translateAuthError } from "@/lib/authErrors";
import AuthShell from "@/components/auth/AuthShell";
import PasswordField from "@/components/auth/PasswordField";

const generateFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const parts = [nav.userAgent, nav.language, screen.width + 'x' + screen.height, screen.colorDepth, nav.hardwareConcurrency, Intl.DateTimeFormat().resolvedOptions().timeZone, nav.platform];
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast({ title: "Pagamento aprovado", description: "Entre ou crie sua conta. O acesso será liberado após a confirmação do pagamento." });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: t('error'), description: translateAuthError(error.message), variant: "destructive" });
      setIsLoading(false);
      return;
    }
    const client = await getSupabaseClient();
    if (!client) {
      toast({ title: t('error'), description: 'Backend indisponível no momento.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const { data: { user: loggedUser } } = await client.auth.getUser();
    if (!loggedUser) { setIsLoading(false); return; }
    const fingerprint = generateFingerprint();
    try {
      if (backendUrl && backendKey) {
        const checkRes = await fetch(`${backendUrl}/functions/v1/login-check`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${backendKey}` }, body: JSON.stringify({ userId: loggedUser.id, deviceFingerprint: fingerprint, userAgent: navigator.userAgent }) });
        const checkData = await checkRes.json();
        if (checkData.blocked) {
          await client.auth.signOut();
          toast({ title: 'Acesso bloqueado', description: checkData.message, variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        if (checkData.message) toast({ title: 'Dispositivo', description: checkData.message });
      }
    } catch (err) { console.error('Login check failed:', err); }
    try { await client.auth.signOut({ scope: 'others' }); } catch { /* Non-critical */ }
    toast({ title: t('loginSuccess'), description: t('welcomeBack') });
    navigate("/dashboard");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const client = await getSupabaseClient();
    if (!client) {
      toast({ title: "Erro", description: "Backend indisponível no momento.", variant: "destructive" });
      setResetLoading(false);
      return;
    }
    const { error } = await client.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) {
      console.error('[resetPasswordForEmail] error:', error);
      toast({ title: "Não foi possível enviar", description: `${translateAuthError(error.message)} ${error.message ? `(${error.message})` : ''}`.trim(), variant: "destructive" });
    } else {
      toast({ title: "Link enviado", description: "Verifique seu e-mail e a pasta de spam. O link chega em até 1 minuto." });
      setShowForgotPassword(false);
    }
    setResetLoading(false);
  };

  return (
    <AuthShell
      eyebrow={showForgotPassword ? "Recupere seu acesso" : "Acesso do cliente"}
      title={showForgotPassword ? "Redefina sua senha" : "Entre na sua conta"}
      description={showForgotPassword ? "Informe o e-mail da sua conta e enviaremos um link seguro para criar uma nova senha." : "Continue de onde parou e acesse suas ferramentas de importação."}
    >
      {showForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="space-y-5 text-foreground">
          <div className="flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-foreground/75">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p>Você receberá um link no e-mail cadastrado para criar uma nova senha.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resetEmail" className="font-semibold">E-mail da conta</Label>
            <Input id="resetEmail" type="email" placeholder="seu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" required className="h-12 rounded-xl focus-visible:ring-gold" />
          </div>
          <Button type="submit" disabled={resetLoading} className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-lg shadow-gold/15 hover:bg-gold/90">
            {resetLoading ? "Enviando..." : "Enviar link de recuperação"}<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button type="button" onClick={() => setShowForgotPassword(false)} className="w-full text-sm font-semibold text-primary transition-colors hover:text-primary/75">Voltar ao login</button>
        </form>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-5 text-foreground">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">{t('email')}</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="h-12 rounded-xl focus-visible:ring-gold" />
            </div>
            <PasswordField id="password" label={t('password')} value={password} onChange={setPassword} autoComplete="current-password" />
            <div className="flex justify-end">
              <button type="button" onClick={() => { setResetEmail(email); setShowForgotPassword(true); }} className="text-sm font-semibold text-primary transition-colors hover:text-primary/75">Esqueci minha senha</button>
            </div>
            <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground shadow-lg shadow-gold/15 transition-all hover:bg-gold/90 hover:shadow-xl">
              {isLoading ? "Entrando..." : t('login')}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>ou</span><span className="h-px flex-1 bg-border" /></div>
          <p className="text-center text-sm text-muted-foreground">{t('noAccount')} <Link to="/cadastro" className="font-bold text-primary hover:text-primary/75">{t('signupNow')}</Link></p>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Seus dados são tratados com segurança.</p>
        </>
      )}
      <img src={wolfLogo} alt="" className="sr-only" />
    </AuthShell>
  );
};

export default Login;
