import { useEffect, useState } from "react";
import { Bell, BellRing, Smartphone, Share, PlusSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  enablePushNotifications,
  hasActivePushSubscription,
  isIOS,
  isStandalone,
  pushSupported,
} from "@/lib/push";

const PushSetupCard = () => {
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = pushSupported();
  const standalone = isStandalone();
  const ios = isIOS();

  useEffect(() => {
    hasActivePushSubscription().then(setActive);
  }, []);

  const activate = async () => {
    setBusy(true);
    const res = await enablePushNotifications();
    setBusy(false);
    if (res.ok) {
      setActive(true);
      toast({ title: "Notificações ativadas ✅", description: "Você será avisado a cada novo lead, mesmo com o app fechado." });
    } else {
      toast({ title: "Não foi possível ativar", description: res.error, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="w-4 h-4 text-accent" /> Notificações push de novos leads
        </CardTitle>
        {active && <Badge variant="secondary">Ativas</Badge>}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!supported ? (
          <p className="text-muted-foreground">
            Este navegador não suporta notificações push. Use o Chrome (Android/desktop) ou o Safari no iOS 16.4+ com o app instalado na tela inicial.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground">
              Receba na barra de notificações do celular sempre que alguém preencher o formulário — igual a uma notificação de banco ou WhatsApp.
            </p>
            <Button onClick={activate} disabled={busy || active} className="gap-2">
              <Bell className="w-4 h-4" />
              {active ? "Notificações ativas" : busy ? "Ativando..." : "Ativar notificações"}
            </Button>
          </>
        )}

        {!standalone && (
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-accent" /> Adicione o painel à tela inicial
            </p>
            <p className="text-muted-foreground">
              Para receber as notificações de forma confiável mesmo com o navegador fechado, instale o painel no celular:
            </p>
            {ios ? (
              <p className="text-muted-foreground flex items-center gap-1 flex-wrap">
                Safari → <Share className="w-3.5 h-3.5" /> Compartilhar → <PlusSquare className="w-3.5 h-3.5" /> "Adicionar à Tela de Início" → abra pelo ícone e ative as notificações aqui.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Chrome → menu (⋮) → "Instalar app" / "Adicionar à tela inicial" → abra pelo ícone e ative as notificações aqui.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PushSetupCard;
