import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Search, RefreshCw, Bell, BellOff } from "lucide-react";
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
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const { toast } = useToast();
  const loadRef = useRef<() => void>(() => {});

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
  loadRef.current = load;

  // Realtime: novo lead -> notificação push (só admins passam pela RLS da tabela)
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const supabase = await getSupabaseClient();
      if (!supabase || cancelled) return;
      const ch = supabase
        .channel("leads-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "leads" },
          (payload: { new: Lead }) => {
            const lead = payload.new;
            const title = "Novo lead 🐺";
            const body = `Novo lead: ${lead.full_name || "sem nome"} acabou de preencher o formulário!`;
            setLeads((prev) => [lead, ...prev.filter((l) => l.id !== lead.id)]);
            toast({ title, description: body });
            void showPush(title, body);
          },
        )
        .subscribe();
      channel = ch;
    })();

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, []);

  const showPush = async (title: string, body: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(title, { body, icon: "/favicon.ico", tag: "novo-lead" });
      } else {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    } catch {
      /* noop */
    }
  };

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
      }
    } catch {
      /* noop */
    }
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      void showPush("Notificações ativadas ✅", "Você será avisado a cada novo lead.");
    } else {
      toast({
        title: "Notificações bloqueadas",
        description: "Libere as notificações nas configurações do navegador.",
        variant: "destructive",
      });
    }
  };

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

  const waLink = (raw: string, name?: string | null) => {
    const digits = (raw || "").replace(/\D/g, "");
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    const firstName = (name || "").trim();
    const message = firstName
      ? `Opa ${firstName}, tudo bem? Eu vi que você preencheu o nosso formulário sobre a mentoria e não efetuou o pagamento. O que está te impedindo de entrar para esse mundo hoje?`
      : "Opa, tudo bem? Eu vi que você preencheu o nosso formulário sobre a mentoria e não efetuou o pagamento. O que está te impedindo de entrar para esse mundo hoje?";
    return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Leads capturados ({filtered.length})</CardTitle>
        <div className="flex items-center gap-1">
          {notifPerm !== "unsupported" && (
            <Button
              variant={notifPerm === "granted" ? "ghost" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={enableNotifications}
              disabled={notifPerm === "granted"}
            >
              {notifPerm === "granted" ? (
                <><Bell className="w-3.5 h-3.5" /> Alertas ativos</>
              ) : (
                <><BellOff className="w-3.5 h-3.5" /> Ativar alertas</>
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
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
                  <a href={waLink(lead.whatsapp, lead.full_name)} target="_blank" rel="noreferrer">
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
