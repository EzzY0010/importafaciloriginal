import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupabaseClient } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  full_name: string;
  whatsapp: string;
  email: string;
  reason: string;
  source: string | null;
  created_at: string;
}

const LeadsTable = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar leads", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as Lead[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.whatsapp?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const waLink = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${full}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Leads capturados ({filtered.length})</CardTitle>
        <Button variant="ghost" size="icon" onClick={load}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou WhatsApp..."
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum lead encontrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((lead) => (
              <div key={lead.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  <p className="text-xs text-muted-foreground">{lead.whatsapp}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{lead.reason}</Badge>
                    {lead.source && (
                      <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={waLink(lead.whatsapp)} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsTable;
