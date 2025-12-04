import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, LogOut, Crown, User, MessageSquare, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/LanguageSelector";
import WolfChat from "@/components/WolfChat";
import ImportCalculator from "@/components/ImportCalculator";
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

  // Show payment screen if user hasn't paid (unless admin)
  const hasAccess = hasPaid || isAdmin;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
              <ShoppingBag className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin 
                    ? 'bg-accent/20 text-accent-foreground' 
                    : 'bg-primary/20 text-primary'
                }`}>
                  {isAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {isAdmin ? t('admin') : t('user')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </Button>
          </div>
        </header>

        {hasAccess ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('wolfTab')}
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-2">
                <Calculator className="w-4 h-4" />
                {t('calculatorTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0">
              <WolfChat />
            </TabsContent>

            <TabsContent value="calculator" className="mt-0">
              <div className="flex justify-center">
                <ImportCalculator />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('unlockAccess')}</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              {t('unlockDescription')}
            </p>
            <PaymentButton onPaymentSuccess={refreshPaymentStatus} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
