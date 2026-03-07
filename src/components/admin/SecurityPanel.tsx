import { ShieldAlert, Globe, Monitor, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "./UsersTable";

interface SecurityPanelProps {
  profiles: UserProfile[];
}

const SecurityPanel = ({ profiles }: SecurityPanelProps) => {
  const bannedUsers = profiles.filter((p) => p.device_approved === false);
  const recentLogins = profiles
    .filter((p) => p.last_login_at)
    .sort((a, b) => new Date(b.last_login_at!).getTime() - new Date(a.last_login_at!).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Banned Users */}
      <Card className="bg-card border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            Usuários Banidos ({bannedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bannedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário banido.</p>
          ) : (
            <div className="space-y-3">
              {bannedUsers.map((p) => (
                <div key={p.id} className="p-3 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                  <p className="text-sm font-medium text-foreground">{p.full_name || p.email || "Sem nome"}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {p.last_ip && <span className="font-mono">IP: {p.last_ip}</span>}
                    {p.last_city && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {p.last_city}, {p.last_country}
                      </span>
                    )}
                    {p.last_user_agent && (
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> {p.last_user_agent.substring(0, 50)}…
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logins */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Últimos Logins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogins.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.full_name || p.email}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono">{p.last_ip || "—"}</span>
                    {p.last_city && <span>{p.last_city}, {p.last_country}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-xs text-muted-foreground">
                    {p.last_login_at && new Date(p.last_login_at).toLocaleString("pt-BR")}
                  </p>
                  <Badge
                    className={`text-xs mt-1 ${
                      p.device_approved === false
                        ? "bg-destructive/20 text-destructive"
                        : "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {p.device_approved === false ? "Banido" : "Ativo"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">🔒 Regras de Segurança Ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ <strong>Multi-Dispositivo Controlado:</strong> Cada conta tem limite de dispositivos (padrão: 1). Liberação de +1 via App Instalado.</p>
          <p>✅ <strong>Sessão Única:</strong> Login novo derruba sessão anterior em cada dispositivo.</p>
          <p>✅ <strong>Vinculação de Dispositivo:</strong> Dispositivos são registrados automaticamente. Exceder o limite bloqueia o acesso.</p>
          <p>✅ <strong>Geolocalização:</strong> Login a +200km em menos de 2h bloqueia automaticamente.</p>
          <p>✅ <strong>Lista Negra de IPs:</strong> IPs bloqueados manualmente ou automaticamente (5+ IPs diferentes em 1h).</p>
          <p>✅ <strong>Monitoramento:</strong> IP, User-Agent, localização e tentativas suspeitas registrados.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPanel;
