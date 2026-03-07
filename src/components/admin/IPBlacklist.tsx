import { useEffect, useState } from "react";
import { Shield, Trash2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import type { UserProfile } from "./UsersTable";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  created_at: string;
}

interface SuspiciousAttempt {
  id: string;
  user_id: string | null;
  ip_address: string | null;
  device_fingerprint: string | null;
  user_agent: string | null;
  city: string | null;
  country: string | null;
  reason: string | null;
  created_at: string;
}

interface IPBlacklistProps {
  profiles: UserProfile[];
}

const IPBlacklist = ({ profiles }: IPBlacklistProps) => {
  const { toast } = useToast();
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [attempts, setAttempts] = useState<SuspiciousAttempt[]>([]);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) return;

    const [ipsRes, attemptsRes] = await Promise.all([
      supabase.from("blocked_ips").select("*").order("created_at", { ascending: false }),
      supabase.from("suspicious_login_attempts").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    setBlockedIps((ipsRes.data as BlockedIP[]) || []);
    setAttempts((attemptsRes.data as SuspiciousAttempt[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const addBlockedIp = async () => {
    if (!newIp.trim()) return;
    const supabase = await getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from("blocked_ips").insert({
      ip_address: newIp.trim(),
      reason: newReason.trim() || "Bloqueio manual pelo admin",
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "IP bloqueado com sucesso" });
      setNewIp("");
      setNewReason("");
      loadData();
    }
  };

  const removeBlockedIp = async (id: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase.from("blocked_ips").delete().eq("id", id);
    setBlockedIps(prev => prev.filter(ip => ip.id !== id));
    toast({ title: "IP desbloqueado" });
  };

  const blockIpFromAttempt = async (ip: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from("blocked_ips").upsert({
      ip_address: ip,
      reason: "Bloqueado a partir de tentativa suspeita",
    }, { onConflict: "ip_address" });
    if (!error) {
      toast({ title: "IP bloqueado" });
      loadData();
    }
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "Desconhecido";
    const p = profiles.find(p => p.id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Add IP */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Bloquear IP Manualmente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input placeholder="Ex: 192.168.1.1" value={newIp} onChange={e => setNewIp(e.target.value)} className="flex-1" />
            <Input placeholder="Motivo (opcional)" value={newReason} onChange={e => setNewReason(e.target.value)} className="flex-1" />
            <Button onClick={addBlockedIp} className="gap-1"><Plus className="w-4 h-4" /> Bloquear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs */}
      <Card className="bg-card border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Shield className="w-5 h-5" />
            IPs Bloqueados ({blockedIps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedIps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum IP na lista negra.</p>
          ) : (
            <div className="space-y-2">
              {blockedIps.map(ip => (
                <div key={ip.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-medium text-foreground">{ip.ip_address}</p>
                    <p className="text-xs text-muted-foreground">{ip.reason} • {new Date(ip.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeBlockedIp(ip.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspicious Attempts */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Tentativas Suspeitas (Últimas 50)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tentativa suspeita registrada.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map(a => (
                <div key={a.id} className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{getUserName(a.user_id)}</p>
                      <Badge variant="outline" className="text-xs">{a.reason}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{a.ip_address || "—"}</span>
                      {a.city && <span>{a.city}, {a.country}</span>}
                      <span>{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  {a.ip_address && !blockedIps.some(b => b.ip_address === a.ip_address) && (
                    <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => blockIpFromAttempt(a.ip_address!)}>
                      <Shield className="w-3 h-3" /> Bloquear IP
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IPBlacklist;
