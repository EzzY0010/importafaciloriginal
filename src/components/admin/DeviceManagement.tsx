import { useEffect, useState } from "react";
import { Smartphone, Trash2, Plus, Minus, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import type { UserProfile } from "./UsersTable";

interface AuthorizedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  ip_address: string | null;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  approved: boolean;
  created_at: string;
}

interface DeviceManagementProps {
  profiles: UserProfile[];
  onRefresh: () => void;
}

const DeviceManagement = ({ profiles, onRefresh }: DeviceManagementProps) => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDevices = async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.from("authorized_devices").select("*").order("created_at", { ascending: false });
    setDevices((data as AuthorizedDevice[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadDevices(); }, []);

  const removeDevice = async (deviceId: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("authorized_devices").delete().eq("id", deviceId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dispositivo removido" });
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    }
  };

  const updateMaxLogins = async (profileId: string, currentMax: number, delta: number) => {
    const newMax = Math.max(1, Math.min(5, currentMax + delta));
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("profiles").update({ max_logins: newMax }).eq("id", profileId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Limite alterado para ${newMax} dispositivo(s)` });
      onRefresh();
    }
  };

  const toggleAppInstalled = async (profileId: string, current: boolean) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const updates: Record<string, unknown> = { app_installed: !current };
    // Auto-increment max_logins to 2 when enabling app_installed
    if (!current) {
      updates.max_logins = 2;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", profileId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !current ? "App marcado como instalado — limite liberado para 2 dispositivos!" : "App desmarcado" });
      onRefresh();
    }
  };

  const getUserName = (userId: string) => {
    const p = profiles.find(p => p.id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  // Group devices by user
  const devicesByUser = devices.reduce((acc, d) => {
    if (!acc[d.user_id]) acc[d.user_id] = [];
    acc[d.user_id].push(d);
    return acc;
  }, {} as Record<string, AuthorizedDevice[]>);

  return (
    <div className="space-y-6">
      {/* User Device Limits */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Controle de Dispositivos por Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles.map(p => {
              const pDevices = devicesByUser[p.id] || [];
              const maxLogins = (p as any).max_logins || 1;
              const appInstalled = (p as any).app_installed || false;
              return (
                <div key={p.id} className="p-3 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.full_name || p.email || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">
                      {pDevices.length}/{maxLogins} dispositivo(s) • {appInstalled ? "📱 App Instalado" : "Sem app"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toggleAppInstalled(p.id, appInstalled)}>
                      {appInstalled ? <><CheckCircle className="w-3 h-3" /> App ✓</> : <><Download className="w-3 h-3" /> Marcar App</>}
                    </Button>
                    <div className="flex items-center gap-1 border border-border rounded-lg px-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateMaxLogins(p.id, maxLogins, -1)} disabled={maxLogins <= 1}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-mono w-4 text-center">{maxLogins}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateMaxLogins(p.id, maxLogins, 1)} disabled={maxLogins >= 5}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Authorized Devices List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            Dispositivos Autorizados ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum dispositivo registrado.</p>
          ) : (
            <div className="space-y-2">
              {devices.map(d => (
                <div key={d.id} className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{getUserName(d.user_id)}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{d.ip_address || "—"}</span>
                      {d.city && <span>{d.city}, {d.country}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px] mt-0.5" title={d.user_agent || ""}>
                      {d.user_agent ? d.user_agent.substring(0, 60) + "…" : d.device_fingerprint}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={d.approved ? "bg-green-500/20 text-green-600 text-xs" : "bg-destructive/20 text-destructive text-xs"}>
                      {d.approved ? "Ativo" : "Revogado"}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeDevice(d.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceManagement;
