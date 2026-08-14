import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseClient } from "@/lib/backend";

/** Dias de antecedência para começar a avisar. */
export const RENEWAL_WARNING_DAYS = 7;

const RECURRING_PLANS = ["mensal", "trimestral", "semestral"];

interface Props {
  onRenew: () => void;
}

const RenewalBanner = ({ onRenew }: Props) => {
  const { user } = useAuth();
  const [planType, setPlanType] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const supabase = await getSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan_type, plan_expires_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setPlanType(data.plan_type ?? null);
      setExpiresAt(data.plan_expires_at ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Vitalício e minicurso nunca recebem aviso
  if (!planType || !RECURRING_PLANS.includes(planType) || !expiresAt) return null;

  const end = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((end - Date.now()) / 86_400_000);
  if (daysLeft > RENEWAL_WARNING_DAYS) return null;

  const expired = daysLeft <= 0;

  return (
    <div
      className={`mb-4 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in ${
        expired
          ? "border-destructive/40 bg-destructive/10"
          : "border-accent/40 bg-accent/10"
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {expired ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">
            {expired
              ? "Sua assinatura venceu. Renove para continuar tendo acesso."
              : `Sua assinatura vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}. Renove agora para não perder o acesso.`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plano {planType} · vencimento em {new Date(expiresAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      <Button size="sm" onClick={onRenew} className="shrink-0">
        Renovar agora
      </Button>
    </div>
  );
};

export default RenewalBanner;
