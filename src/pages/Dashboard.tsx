import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, Crown, User, HelpCircle, Menu, Sun, Moon, Monitor } from "lucide-react";
import wolfPaymentLogo from "@/assets/wolf-payment-logo.png";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/LanguageSelector";
import WolfChat from "@/components/WolfChat";
import AdvancedPricingCalculator from "@/components/AdvancedPricingCalculator";
import CurrencyConverter from "@/components/CurrencyConverter";
import PaymentButton from "@/components/PaymentButton";
import MinicursoBuyCard from "@/components/MinicursoBuyCard";
import InteractiveOnboarding, { startInteractiveOnboarding } from "@/components/InteractiveOnboarding";
import { getSavedActiveTab, saveActiveTab } from "@/components/AppResilience";
import SourcesDialog from "@/components/SourcesDialog";
import RenewalBanner from "@/components/RenewalBanner";
import HomeView from "@/components/dashboard/HomeView";
import BottomNav from "@/components/dashboard/BottomNav";
import MinicursoGate from "@/components/MinicursoGate";
import { PLANS, getDiscountPercent, type PlanId } from "@/config/plans";
import { useTheme } from "next-themes";

const Dashboard = () => {
  const { user, isAdmin, hasAccess: subscriptionActive, hasMinicourse, signOut, loading, refreshPaymentStatus } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(() => getSavedActiveTab() || "home");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(() => {
    const q = searchParams.get('plan') as PlanId | null;
    if (q && PLANS.some((p) => p.id === q)) return q;
    return 'anual';
  });

  useEffect(() => {
    saveActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: t('paymentSuccess'),
        description: t('paymentSuccessDesc'),
      });
      let cancelled = false;
      const waitForWebhook = async () => {
        for (let attempt = 0; attempt < 10 && !cancelled; attempt += 1) {
          await refreshPaymentStatus();
          if (attempt < 9) await new Promise((resolve) => window.setTimeout(resolve, 3000));
        }
      };
      void waitForWebhook();
      return () => { cancelled = true; };
    } else if (paymentStatus === 'failure') {
      toast({
        title: t('paymentFailed'),
        description: t('paymentFailedDesc'),
        variant: 'destructive'
      });
    }
  }, [searchParams, t]);

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as string;
      if (tab === 'chat' || tab === 'calculator' || tab === 'home') setActiveTab(tab);
    };
    window.addEventListener('tutorial-set-tab', handler);
    return () => window.removeEventListener('tutorial-set-tab', handler);
  }, []);

  const handleTabChange = (value: string) => {
    if (value === 'sources') {
      setSourcesOpen(true);
      return; // don't switch active tab
    }
    if (value === 'profile') {
      setMenuOpen(true);
      return;
    }
    setActiveTab(value);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const hasAccess = subscriptionActive || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      <InteractiveOnboarding />
      {/* Header fixo */}
      <header className="header-gradient sticky top-0 z-50 shadow-medium">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={wolfLogo} alt="ImportaFácil" className="w-10 h-10 rounded-xl shadow-soft shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-primary-foreground truncate">{t('appName')}</h1>
                <p className="text-[11px] text-primary-foreground/70 truncate">Lobo das Importações</p>
              </div>
            </div>

            <div data-tour="topbar" className="flex items-center gap-1">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button data-tour="menu" variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label="Menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex min-w-0 items-center gap-2">
                      {isAdmin ? <Crown className="w-4 h-4 text-accent" /> : <User className="w-4 h-4" />}
                      <span className="min-w-0 break-all text-left text-sm font-semibold leading-tight">{user.email}</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {isAdmin && (
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setMenuOpen(false); navigate('/admin'); }}>
                        <Crown className="w-4 h-4 text-accent" /> Admin
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setMenuOpen(false); startInteractiveOnboarding(); }}>
                      <HelpCircle className="w-4 h-4" /> Ajuda / Como usar
                    </Button>
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tema</p>
                      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Escolha do tema">
                        {([
                          { value: "light", label: "Claro", icon: Sun },
                          { value: "dark", label: "Escuro", icon: Moon },
                          { value: "system", label: "Sistema", icon: Monitor },
                        ] as const).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={theme === value}
                            onClick={() => setTheme(value)}
                            className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors ${theme === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2"><LanguageSelector /></div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" /> {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-28">
        <div className="max-w-5xl mx-auto">
          {hasAccess ? (
            <>
            <RenewalBanner onRenew={() => navigate('/dashboard?plan=anual')} />
            <SourcesDialog open={sourcesOpen} onOpenChange={setSourcesOpen} />
            {activeTab === 'home' && (
              <HomeView
                onAnalyze={() => setActiveTab('chat')}
                onSources={() => setSourcesOpen(true)}
                onCalculator={() => setActiveTab('calculator')}
              />
            )}
            {activeTab === 'chat' && (
              <div className="animate-fade-in"><WolfChat /></div>
            )}
            {activeTab === 'calculator' && (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <CurrencyConverter />
                <AdvancedPricingCalculator />
              </div>
            )}
            </>
          ) : hasMinicourse ? (
            <MinicursoGate />
          ) : (
            <div className="max-w-4xl mx-auto animate-slide-up">
              <div className="text-center mb-6">
                <img src={wolfPaymentLogo} alt="ImportaFácil" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">{t('unlockAccess')}</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Escolha o plano que combina com o seu momento.
                </p>
              </div>
              <div className="max-w-md mx-auto mb-6">
                <p className="text-center text-xs text-muted-foreground mb-2">Prefere começar pelo básico?</p>
                <MinicursoBuyCard variant="card" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5 shadow-medium'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Melhor oferta
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">{plan.name}</p>
                    {plan.previousPrice && <p className="text-xs text-muted-foreground line-through">De R$ {plan.previousPrice.toFixed(2).replace('.', ',')}</p>}
                    <p className="text-xl font-extrabold text-foreground mt-1">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </p>
                    {getDiscountPercent(plan) && <span className="text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5">-{getDiscountPercent(plan)}%</span>}
                    <p className="text-[11px] text-muted-foreground">{plan.period}</p>
                  </button>
                ))}
              </div>
              <div className="max-w-md mx-auto">
                <PaymentButton
                  onPaymentSuccess={refreshPaymentStatus}
                  planId={selectedPlan}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {hasAccess && <BottomNav active={activeTab} onSelect={handleTabChange} />}
    </div>
  );
};

export default Dashboard;
