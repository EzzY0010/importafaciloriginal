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
import LeadsTable from "@/components/admin/LeadsTable";
import PushSetupCard from "@/components/admin/PushSetupCard";
import MinicursoFiles from "@/components/admin/MinicursoFiles";

const AdminPanel = () => {
  const { user, isAdmin, loading } = useAuth();
  const ADMIN_DEVICE_MANAGER_EMAIL = "administradorezzy00@gmail.com";
  const canManageDeviceLimit = user?.email === ADMIN_DEVICE_MANAGER_EMAIL;
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

    let { error } = await supabase.rpc("admin_set_profile_access", {
      _profile_id: profileId,
      _enabled: newStatus,
    });

    // Compatibilidade com a produção antiga, onde o RPC ainda não existe.
    // A própria policy de admin continua protegendo esta atualização.
    if (error) {
      const fallback = await supabase
        .from("profiles")
        .update({ has_paid: newStatus })
        .eq("id", profileId);
      error = fallback.error;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus ? "Acesso ativado" : "Acesso removido" });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, has_paid: newStatus } : p))
      );
    }
  };

  const manageTierAccess = async (tier: "beginners" | "full", email: string | null, enabled: boolean) => {
    if (!email) {
      toast({ title: "Usuário sem e-mail", description: "Não é possível alterar o acesso desta conta.", variant: "destructive" });
      return;
    }
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const rpcName = tier === "beginners" ? "admin_set_beginners_access_by_email" : "admin_set_full_access_by_email";
    const { error: rpcError } = await supabase.rpc(
      rpcName,
      { _email: email, _enabled: enabled },
    );
    if (rpcError) {
      const functionMissing = rpcError.code === "PGRST202" &&
        (rpcError.message.toLowerCase().includes("schema cache") || rpcError.message.includes(rpcName));
      if (!functionMissing) {
        toast({ title: `Erro no acesso ${tier === "beginners" ? "Beginners" : "Full"}`, description: rpcError.message, variant: "destructive" });
        return;
      }

      // Compatibilidade enquanto a migration RPC não foi aplicada no Supabase.
      // A política RLS "Admins can update all profiles" continua autorizando somente admins.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, has_paid, plan_type, plan_expires_at, legacy_access")
        .eq("email", email.trim())
        .maybeSingle();

      if (profileError || !profile) {
        toast({
          title: `Erro no acesso ${tier === "beginners" ? "Beginners" : "Full"}`,
          description: profileError?.message ?? "Nenhuma conta encontrada para este e-mail.",
          variant: "destructive",
        });
        return;
      }

      if (tier === "beginners" && enabled) {
        const hasActiveFull = profile.legacy_access === true || (
          profile.has_paid === true &&
          profile.plan_type !== "beginners" &&
          profile.plan_type !== "grupo" &&
          profile.plan_expires_at !== null &&
          Date.parse(profile.plan_expires_at) > Date.now()
        );
        if (hasActiveFull) {
          toast({ title: "Acesso não alterado", description: "Esta conta possui acesso Full ativo e não pode ser rebaixada para Beginners.", variant: "destructive" });
          return;
        }
      }
      if (tier === "beginners" && !enabled && profile.plan_type !== "beginners") {
        toast({ title: "Acesso não alterado", description: "Esta conta não possui Beginners ativo.", variant: "destructive" });
        return;
      }
      if (tier === "full" && !enabled && (profile.legacy_access !== true || !profile.plan_type)) {
        toast({ title: "Acesso não alterado", description: "Esta conta não possui acesso Full permanente.", variant: "destructive" });
        return;
      }

      const profileUpdate = tier === "beginners"
        ? {
            has_paid: enabled,
            plan_type: enabled ? "beginners" : null,
            plan_expires_at: enabled ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            legacy_access: enabled ? false : profile.legacy_access,
          }
        : {
            has_paid: enabled,
            plan_type: enabled ? "vitalicio" : null,
            plan_expires_at: null,
            legacy_access: enabled,
          };
      const { error: updateError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", profile.id);

      if (updateError) {
        toast({ title: `Erro no acesso ${tier === "beginners" ? "Beginners" : "Full"}`, description: updateError.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: `${tier === "beginners" ? "Beginners" : "Full"} ${enabled ? "ativado" : "removido"}` });
    await loadProfiles();
  };

  const incrementDeviceLimit = async (profileId: string, currentLimit: number) => {
    const newLimit = (currentLimit || 1) + 1;
    const supabase = await getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from("profiles")
      .update({ max_logins: newLimit })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Limite de dispositivos atualizado para ${newLimit}` });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, max_logins: newLimit } : p))
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
                {activeSection === "leads" && "Leads"}
               {activeSection === "minicurso" && "Minicurso"}
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
                  onIncrementDeviceLimit={incrementDeviceLimit}
                  canManageDeviceLimit={canManageDeviceLimit}
                  onManageBeginnersAccess={(email, enabled) => void manageTierAccess("beginners", email, enabled)}
                  onManageFullAccess={(email, enabled) => void manageTierAccess("full", email, enabled)}
                />
                <PushSetupCard />
                <LeadsTable />
              </>
            )}

            {activeSection === "leads" && (
              <>
                <PushSetupCard />
                <LeadsTable />
              </>
            )}
            {activeSection === "minicurso" && <MinicursoFiles />}
            {activeSection === "users" && (
              <UsersTable
                profiles={profiles}
                loading={loadingProfiles}
                onToggleBan={toggleBan}
                onTogglePayment={togglePayment}
                onIncrementDeviceLimit={incrementDeviceLimit}
                canManageDeviceLimit={canManageDeviceLimit}
                onManageBeginnersAccess={(email, enabled) => void manageTierAccess("beginners", email, enabled)}
                onManageFullAccess={(email, enabled) => void manageTierAccess("full", email, enabled)}
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
