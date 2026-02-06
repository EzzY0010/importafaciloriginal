import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, LogOut, Crown, User, MessageSquare, Calculator, ArrowRightLeft } from "lucide-react";
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

const Dashboard = () => {
  const { user, isAdmin, hasPaid, signOut, loading, refreshPaymentStatus } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
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
    navigate("/");
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
      {/* Header - Azul Petróleo */}
      <header className="header-gradient sticky top-0 z-50 shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-soft">
                <Package className="w-5 h-5 text-accent-foreground" />
              </div>
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