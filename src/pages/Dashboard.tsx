import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, LogOut, Crown, User, MessageSquare, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import WolfChat from "@/components/WolfChat";
import ImportCalculator from "@/components/ImportCalculator";

const Dashboard = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              🐺 Lobo das Importações
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="w-4 h-4" />
              📊 Calculadora
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <WolfChat />
          </TabsContent>

          <TabsContent value="calculator" className="mt-0">
            <div className="flex flex-col items-center gap-6">
              <ImportCalculator />
              
              <Card className="p-6 max-w-md w-full">
                <h3 className="font-semibold text-foreground mb-2">{t('pricing')}</h3>
                <p className="text-3xl font-bold text-primary">R$ 12,00</p>
                <p className="text-sm text-muted-foreground">{t('fixedPrice')} - {t('perAccess')}</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
