import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, LogOut, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const Dashboard = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

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
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
              <ShoppingBag className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </Button>
          </div>
        </header>

        <Card className="p-8 shadow-strong animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isAdmin ? 'bg-accent' : 'bg-primary'}`}>
              {isAdmin ? (
                <Crown className="w-8 h-8 text-accent-foreground" />
              ) : (
                <User className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {t('welcome')}, {user.email?.split('@')[0]}!
              </h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                isAdmin 
                  ? 'bg-accent/20 text-accent-foreground' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {isAdmin ? (
                  <>
                    <Crown className="w-3 h-3" />
                    {t('admin')}
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" />
                    {t('user')}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2">{t('pricing')}</h3>
              <p className="text-3xl font-bold text-primary">R$ 12,00</p>
              <p className="text-sm text-muted-foreground">{t('fixedPrice')} - {t('perAccess')}</p>
            </Card>
            
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2">{t('email')}</h3>
              <p className="text-lg text-foreground">{user.email}</p>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
