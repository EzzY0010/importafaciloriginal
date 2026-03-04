import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Smartphone, MapPin, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  has_paid: boolean | null;
  device_approved: boolean | null;
  last_device_fingerprint: string | null;
  last_ip: string | null;
  last_city: string | null;
  last_country: string | null;
  last_login_at: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  created_at: string;
}

const FORCE_MOCK_MODE = true;
const isBackendConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) && !FORCE_MOCK_MODE;

const mockProfiles: UserProfile[] = [
  {
    id: "mock-1",
    email: "aluno1@demo.com",
    full_name: "Aluno Demo 1",
    has_paid: true,
    device_approved: false,
    last_device_fingerprint: "fp_demo_001",
    last_ip: "189.120.xx.xx",
    last_city: "São Paulo",
    last_country: "BR",
    last_login_at: new Date().toISOString(),
    last_latitude: null,
    last_longitude: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    email: "aluno2@demo.com",
    full_name: "Aluno Demo 2",
    has_paid: false,
    device_approved: true,
    last_device_fingerprint: "fp_demo_002",
    last_ip: "177.18.xx.xx",
    last_city: "Lisboa",
    last_country: "PT",
    last_login_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    last_latitude: null,
    last_longitude: null,
    created_at: new Date().toISOString(),
  },
];

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (!isBackendConfigured) return;
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isBackendConfigured || isAdmin) loadProfiles();
  }, [isAdmin]);

  const loadProfiles = async () => {
    setLoadingProfiles(true);

    if (!isBackendConfigured) {
      setProfiles(mockProfiles);
      setLoadingProfiles(false);
      return;
    }

    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("last_login_at", { ascending: false });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
    setLoadingProfiles(false);
  };

  const toggleDeviceApproval = async (profileId: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;

    if (!isBackendConfigured) {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, device_approved: newStatus } : p)));
      toast({ title: "Modo demo", description: "Alteração aplicada apenas localmente." });
      return;
    }

    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from("profiles")
      .update({ device_approved: newStatus })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: newStatus ? "Dispositivo Liberado" : "Dispositivo Bloqueado",
        description: newStatus ? "O usuário pode acessar novamente." : "O acesso foi bloqueado.",
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, device_approved: newStatus } : p))
      );
    }
  };

  const togglePayment = async (profileId: string, currentStatus: boolean | null) => {
    const newStatus = !currentStatus;

    if (!isBackendConfigured) {
      setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, has_paid: newStatus } : p)));
      toast({ title: "Modo demo", description: "Alteração aplicada apenas localmente." });
      return;
    }

    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase
      .from("profiles")
      .update({ has_paid: newStatus })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus ? "Pagamento ativado" : "Pagamento removido" });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, has_paid: newStatus } : p))
      );
    }
  };

  if ((loading && isBackendConfigured) || (isBackendConfigured && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const blockedUsers = profiles.filter((p) => p.device_approved === false);
  const paidUsers = profiles.filter((p) => p.has_paid);
  const recentLogins = profiles.filter((p) => p.last_login_at);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient sticky top-0 z-50 shadow-medium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Shield className="w-6 h-6 text-accent" />
              <h1 className="text-lg font-bold text-primary-foreground">Painel Admin</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={loadProfiles} className="text-primary-foreground">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="card-premium text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Total Usuários</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-600">{paidUsers.length}</p>
              <p className="text-xs text-muted-foreground">Pagantes</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-destructive">{blockedUsers.length}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-secondary">{recentLogins.length}</p>
              <p className="text-xs text-muted-foreground">Com Login</p>
            </CardContent>
          </Card>
        </div>

        {/* Blocked Users */}
        {blockedUsers.length > 0 && (
          <Card className="card-premium border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                Dispositivos Bloqueados ({blockedUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blockedUsers.map((p) => (
                <UserRow key={p.id} profile={p} onToggleDevice={toggleDeviceApproval} onTogglePayment={togglePayment} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Todos os Usuários ({profiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingProfiles ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              profiles.map((p) => (
                <UserRow key={p.id} profile={p} onToggleDevice={toggleDeviceApproval} onTogglePayment={togglePayment} />
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const UserRow: React.FC<{
  profile: UserProfile;
  onToggleDevice: (id: string, current: boolean | null) => void;
  onTogglePayment: (id: string, current: boolean | null) => void;
}> = ({ profile, onToggleDevice, onTogglePayment }) => {
  const isBlocked = profile.device_approved === false;

  return (
    <div className={`p-3 rounded-xl border ${isBlocked ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{profile.full_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email || "Sem email"}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {profile.has_paid ? (
            <Badge className="bg-green-500/20 text-green-600 text-xs">Pago</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Free</Badge>
          )}
          {isBlocked ? (
            <Badge className="bg-destructive/20 text-destructive text-xs">Bloqueado</Badge>
          ) : (
            <Badge className="bg-green-500/20 text-green-600 text-xs">Ativo</Badge>
          )}
        </div>
      </div>

      {/* Location & Device Info */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {profile.last_city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {profile.last_city}, {profile.last_country}
          </span>
        )}
        {profile.last_ip && (
          <span>IP: {profile.last_ip}</span>
        )}
        {profile.last_login_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(profile.last_login_at).toLocaleString("pt-BR")}
          </span>
        )}
        {profile.last_device_fingerprint && (
          <span>FP: {profile.last_device_fingerprint}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant={isBlocked ? "default" : "destructive"}
          className="h-7 text-xs"
          onClick={() => onToggleDevice(profile.id, profile.device_approved)}
        >
          {isBlocked ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" /> Liberar
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" /> Bloquear
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onTogglePayment(profile.id, profile.has_paid)}
        >
          {profile.has_paid ? "Remover Pagamento" : "Ativar Pagamento"}
        </Button>
      </div>
    </div>
  );
};

export default AdminPanel;
