import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "@/components/LanguageSelector";

// Generate a simple device fingerprint from browser properties
const generateFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const parts = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    nav.hardwareConcurrency,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    nav.platform,
  ];
  // Simple hash
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // RULE 3: Sign out all other sessions first (single session)
    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Get the current user after login
    const { data: { user: loggedUser } } = await supabase.auth.getUser();
    if (!loggedUser) {
      setIsLoading(false);
      return;
    }

    // Generate device fingerprint and check with backend
    const fingerprint = generateFingerprint();
    try {
      const checkRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userId: loggedUser.id,
          deviceFingerprint: fingerprint,
        }),
      });
      const checkData = await checkRes.json();

      if (checkData.blocked) {
        // Sign out immediately if blocked
        await supabase.auth.signOut();
        toast({
          title: '🔒 Acesso Bloqueado',
          description: checkData.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('Login check failed:', err);
      // Allow login if check fails (graceful degradation)
    }

    // RULE 3: Sign out other sessions (single session enforcement)
    try {
      await supabase.auth.signOut({ scope: 'others' });
    } catch {
      // Non-critical
    }

    toast({
      title: t('loginSuccess'),
      description: t('welcomeBack'),
    });
    navigate("/dashboard");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "https://importafaciloriginal.lovable.app/reset-password",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setShowForgotPassword(false);
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-strong animate-slide-up">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        <div className="flex flex-col items-center mb-8">
          <img src={wolfLogo} alt="ImportaFácil" className="w-20 h-20 rounded-2xl mb-4 shadow-medium" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('appName')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('enterYourAccount')}</p>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <p className="text-sm text-muted-foreground text-center">
              Digite seu e-mail para receber o link de recuperação.
            </p>
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-foreground font-medium">E-mail</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="h-12 transition-all focus:shadow-soft"
              />
            </div>
            <Button type="submit" disabled={resetLoading} className="w-full h-12 bg-gradient-primary hover:opacity-90 font-semibold text-base">
              {resetLoading ? "..." : "Enviar link de recuperação"}
            </Button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 transition-all focus:shadow-soft"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 transition-all focus:shadow-soft"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Esqueci minha senha
              </button>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all shadow-soft hover:shadow-medium font-semibold text-base"
              >
                {isLoading ? "..." : t('login')}
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              {t('noAccount')}{" "}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                {t('signupNow')}
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Login;
