import { CheckCircle, XCircle, Ban, ShieldCheck, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

interface UsersTableProps {
  profiles: UserProfile[];
  loading: boolean;
  onToggleBan: (id: string, currentApproved: boolean | null) => void;
  onTogglePayment: (id: string, currentPaid: boolean | null) => void;
}

const UsersTable = ({ profiles, loading, onToggleBan, onTogglePayment }: UsersTableProps) => {
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
          Todos os Usuários ({profiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
              {profiles.map((p) => {
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTable;
