import { useState, useMemo } from "react";
import { Ban, ShieldCheck, Monitor, Globe, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UserProfile {
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
  last_user_agent: string | null;
  created_at: string;
  max_logins?: number | null;
}

interface UsersTableProps {
  profiles: UserProfile[];
  loading: boolean;
  onToggleBan: (id: string, currentApproved: boolean | null) => void;
  onTogglePayment: (id: string, currentPaid: boolean | null) => void;
  onIncrementDeviceLimit?: (id: string, currentLimit: number) => void;
  canManageDeviceLimit?: boolean;
}

const UsersTable = ({ profiles, loading, onToggleBan, onTogglePayment, onIncrementDeviceLimit, canManageDeviceLimit }: UsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return profiles.filter((p) => {
      const matchesSearch =
        !query ||
        (p.full_name?.toLowerCase().includes(query) ?? false) ||
        (p.email?.toLowerCase().includes(query) ?? false);

      const isBanned = p.device_approved === false;
      const isActive = p.device_approved === true;

      let matchesActivity = true;
      if (activityFilter === "active") matchesActivity = isActive;
      else if (activityFilter === "inactive") matchesActivity = p.device_approved === null;
      else if (activityFilter === "banned") matchesActivity = isBanned;

      let matchesPlan = true;
      if (planFilter === "paid") matchesPlan = p.has_paid === true;
      else if (planFilter === "free") matchesPlan = p.has_paid !== true;

      return matchesSearch && matchesActivity && matchesPlan;
    });
  }, [profiles, searchQuery, activityFilter, planFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          Todos os Usuários ({filteredProfiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3 border-b border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-background">
                <SelectValue placeholder="Status de Atividade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Não Ativos</SelectItem>
                <SelectItem value="banned">Banidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                <SelectValue placeholder="Status de Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagantes</SelectItem>
                <SelectItem value="free">Não Pagantes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Último IP</TableHead>
                <TableHead className="hidden lg:table-cell">Dispositivo</TableHead>
                <TableHead className="hidden md:table-cell">Local</TableHead>
                <TableHead className="hidden lg:table-cell">Último Login</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((p) => {
                const isBanned = p.device_approved === false;
                return (
                  <TableRow key={p.id} className={`border-border ${isBanned ? "bg-destructive/5" : ""}`}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                          {p.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {p.email || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {isBanned ? (
                          <Badge variant="destructive" className="text-xs w-fit">Banido</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs w-fit">Ativo</Badge>
                        )}
                        {p.has_paid ? (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs w-fit">Pago</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs w-fit">Free</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">{p.last_ip || "—"}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground truncate block max-w-[200px]" title={p.last_user_agent || ""}>
                        {p.last_user_agent ? p.last_user_agent.substring(0, 40) + "…" : p.last_device_fingerprint || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.last_city ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {p.last_city}, {p.last_country}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {p.last_login_at ? new Date(p.last_login_at).toLocaleString("pt-BR") : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant={isBanned ? "default" : "destructive"}
                          className="h-7 text-xs gap-1"
                          onClick={() => onToggleBan(p.id, p.device_approved)}
                        >
                          {isBanned ? (
                            <><ShieldCheck className="w-3 h-3" /> Liberar</>
                          ) : (
                            <><Ban className="w-3 h-3" /> Banir</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onTogglePayment(p.id, p.has_paid)}
                        >
                          {p.has_paid ? "Remover Pgto" : "Ativar Pgto"}
                        </Button>
                        {canManageDeviceLimit && onIncrementDeviceLimit && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1 bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                            onClick={() => onIncrementDeviceLimit(p.id, p.max_logins ?? 1)}
                            title={`Limite atual: ${p.max_logins ?? 1}`}
                          >
                            <Plus className="w-3 h-3" /> +1 Disp ({p.max_logins ?? 1})
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTable;
