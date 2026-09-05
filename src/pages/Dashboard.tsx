import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, Crown, User, HelpCircle, Bell, Menu } from "lucide-react";
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
import OnboardingTutorial from "@/components/OnboardingTutorial";
import WelcomeOnboarding, { startWelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { getSavedActiveTab, saveActiveTab } from "@/components/AppResilience";
import SourcesDialog from "@/components/SourcesDialog";
import RenewalBanner from "@/components/RenewalBanner";
import HomeView from "@/components/dashboard/HomeView";
import BottomNav from "@/components/dashboard/BottomNav";
import { PLANS, type PlanId } from "@/config/plans";

const Dashboard = () => {
  const { user, isAdmin, hasPaid, signOut, loading, refreshPaymentStatus } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(() => getSavedActiveTab() || "home");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(() => {
    const q = searchParams.get('plan') as PlanId | null;
    if (q && PLANS.some((p) => p.id === q)) return q;
    return 'vitalicio';
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
      refreshPaymentStatus();
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
      if (tab === 'chat' || tab === 'calculator') setActiveTab(tab);
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

  const hasAccess = hasPaid || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      <OnboardingTutorial />
      <WelcomeOnboarding />
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
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                aria-label="Notificações"
                onClick={() => toast({ title: 'Sem novidades', description: 'Você não tem notificações no momento.' })}
              >
                <Bell className="w-5 h-5" />
              </Button>
              <a
                href="https://chat.whatsapp.com/IBxNhd45sfF6lNCKIxpe7N"
                target="_blank"
                rel="noopener noreferrer"
                data-tour="whatsapp"
                className="p-2 rounded-xl text-[#25D366] hover:bg-primary-foreground/10 transition-colors"
                aria-label="Comunidade no WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" aria-label="Menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      {isAdmin ? <Crown className="w-4 h-4 text-accent" /> : <User className="w-4 h-4" />}
                      {user.email}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {isAdmin && (
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setMenuOpen(false); navigate('/admin'); }}>
                        <Crown className="w-4 h-4 text-accent" /> Admin
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setMenuOpen(false); startWelcomeOnboarding(); }}>
                      <HelpCircle className="w-4 h-4" /> Ajuda / Como usar
                    </Button>
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
            <RenewalBanner onRenew={() => navigate('/dashboard?plan=vitalicio')} />
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
          ) : (
            <div className="max-w-4xl mx-auto animate-slide-up">
              <div className="text-center mb-6">
                <img src={wolfPaymentLogo} alt="ImportaFácil" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">{t('unlockAccess')}</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Escolha o plano que combina com o seu momento.
                </p>
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
                    <p className="text-xl font-extrabold text-foreground mt-1">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </p>
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
              <div className="max-w-md mx-auto mt-6">
                <p className="text-center text-xs text-muted-foreground mb-2">Prefere começar pelo básico?</p>
                <MinicursoBuyCard variant="card" />
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