import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, LogOut, Crown, User, MessageSquare, Calculator, ArrowRightLeft } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/LanguageSelector";
import WolfChat from "@/components/WolfChat";
import AdvancedPricingCalculator from "@/components/AdvancedPricingCalculator";
import CurrencyConverter from "@/components/CurrencyConverter";
import PaymentButton from "@/components/PaymentButton";
import OnboardingTutorial from "@/components/OnboardingTutorial";

const Dashboard = () => {
  const { user, isAdmin, hasPaid, signOut, loading, refreshPaymentStatus } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");

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
      {/* Header - Azul Petróleo */}
      <header className="header-gradient sticky top-0 z-50 shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={wolfLogo} alt="ImportaFácil" className="w-10 h-10 rounded-xl shadow-soft" />
              <div>
                <h1 className="text-lg font-bold text-primary-foreground">{t('appName')}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-primary-foreground/20 text-primary-foreground'
                }`}>
                  {isAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {isAdmin ? t('admin') : t('user')}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <a
                href="https://chat.whatsapp.com/IBxNhd45sfF6lNCKIxpe7N"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#25D366] hover:text-[#20bd5a] transition-colors font-medium"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="hidden sm:inline">Comunidade</span>
              </a>
              <LanguageSelector />
              <Button 
                variant="ghost" 
                onClick={handleLogout} 
                className="gap-2 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {hasAccess ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Styled Tabs */}
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 bg-card border border-border p-1 rounded-2xl shadow-card">
                <TabsTrigger 
                  value="chat" 
                  className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft font-medium transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Import Wolf
                </TabsTrigger>
                <TabsTrigger 
                  value="calculator" 
                  className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft font-medium transition-all"
                >
                  <Calculator className="w-4 h-4" />
                  {t('calculatorTab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-0 animate-fade-in">
                <WolfChat />
              </TabsContent>

              <TabsContent value="calculator" className="mt-0 animate-fade-in">
                <div className="flex flex-col items-center gap-6">
                  <CurrencyConverter />
                  <AdvancedPricingCalculator />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="card-premium max-w-lg mx-auto text-center animate-slide-up">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">{t('unlockAccess')}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t('unlockDescription')}
              </p>
              <PaymentButton onPaymentSuccess={refreshPaymentStatus} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;