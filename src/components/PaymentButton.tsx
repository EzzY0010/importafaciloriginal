import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/backend";
import PixCheckoutDialog from "@/components/PixCheckoutDialog";
import { getPlan, type PlanId } from "@/config/plans";

interface PaymentButtonProps {
  onPaymentSuccess?: () => void;
  planId?: PlanId;
  compact?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ planId = "anual", compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const plan = getPlan(planId);

  const [open, setOpen] = useState(false);

  const handlePayment = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const client = await getSupabaseClient();
    const session = client ? (await client.auth.getSession()).data.session : null;
    setIsLoading(false);
    if (!session) {
      toast({ title: "Faça login", description: "Você precisa estar logado para fazer o pagamento.", variant: "destructive" });
      return;
    }
    setOpen(true);
  };

  const dialog = (
    <PixCheckoutDialog open={open} onOpenChange={setOpen} functionName="appcnpay-pix" title={plan.name} amount={plan.price} extraBody={{ planId: plan.id }} />
  );

  if (compact) {
    return (
      <>{dialog}
      <Button onClick={handlePayment} disabled={isLoading} className="w-full font-bold gap-2">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Pagar com Pix</>}
      </Button></>
    );
  }

  return (
    <>{dialog}
    <Card className="w-full max-w-md mx-auto bg-white text-foreground border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2 text-foreground">
          <CreditCard className="h-6 w-6" />
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>🔥 Oferta por tempo limitado</p>
          <p className="text-4xl font-extrabold mt-1 text-foreground">
            R$ {plan.price.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{plan.period}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span>Estrategista 24h: Tire dúvidas sobre impostos, fretes e regras.</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span>Simulador de Lucro: Saiba quanto vai pagar antes de encomendar.</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span>Análise Técnica: Identifique detalhes do produto por foto.</span></div>
          <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span>Histórico Salvo: Suas perguntas e planos ficam guardados.</span></div>
        </div>

        <Button onClick={handlePayment} disabled={isLoading} className="w-full text-lg py-6" size="lg">
          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processando...</> : <><CreditCard className="h-5 w-5 mr-2" />PAGAR COM PIX</>}
        </Button>

        <p className="text-xs text-center text-muted-foreground">Pagamento seguro via Pix</p>
      </CardContent>
    </Card></>
  );
};

export default PaymentButton;
