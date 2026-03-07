import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient, isBackendConfigured } from "@/lib/backend";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import OverviewCards from "@/components/admin/OverviewCards";
import UsersTable, { type UserProfile } from "@/components/admin/UsersTable";
import SecurityPanel from "@/components/admin/SecurityPanel";
import DeviceManagement from "@/components/admin/DeviceManagement";
import IPBlacklist from "@/components/admin/IPBlacklist";

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) loadProfiles();
  }, [isAdmin]);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoadingProfiles(false);
      toast({ title: "Erro", description: "Backend indisponível.", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("last_login_at", { ascending: false });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((data as UserProfile[]) || []);
    }
    setLoadingProfiles(false);
  };

  const toggleBan = async (profileId: string, currentApproved: boolean | null) => {
    const newStatus = !currentApproved;
    const supabase = await getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("profiles")
      .update({ device_approved: newStatus })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus ? "Usuário Liberado" : "Usuário Banido" });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, device_approved: newStatus } : p))
      );
    }
  };

  const togglePayment = async (profileId: string, currentPaid: boolean | null) => {
    const newStatus = !currentPaid;
    const supabase = await getSupabaseClient();
    if (!supabase) return;

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

  if (loading || (!isAdmin && isBackendConfigured)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeCount = profiles.filter((p) => p.device_approved !== false).length;
  const bannedCount = profiles.filter((p) => p.device_approved === false).length;
  const paidCount = profiles.filter((p) => p.has_paid).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-bold text-foreground capitalize">
                {activeSection === "overview" && "Visão Geral"}
                {activeSection === "users" && "Usuários"}
                {activeSection === "devices" && "Dispositivos"}
                {activeSection === "blacklist" && "IPs Bloqueados"}
                {activeSection === "security" && "Segurança"}
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={loadProfiles}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
              {activeSection === "overview" && (
              <>
                <OverviewCards
                  total={profiles.length}
                  active={activeCount}
                  banned={bannedCount}
                  paid={paidCount}
                />
                <UsersTable
                  profiles={profiles}
                  loading={loadingProfiles}
                  onToggleBan={toggleBan}
                  onTogglePayment={togglePayment}
                />
              </>
            )}

            {activeSection === "users" && (
              <UsersTable
                profiles={profiles}
                loading={loadingProfiles}
                onToggleBan={toggleBan}
                onTogglePayment={togglePayment}
              />
            )}

            {activeSection === "devices" && (
              <DeviceManagement profiles={profiles} onRefresh={loadProfiles} />
            )}

            {activeSection === "blacklist" && (
              <IPBlacklist profiles={profiles} />
            )}

            {activeSection === "security" && (
              <SecurityPanel profiles={profiles} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;
