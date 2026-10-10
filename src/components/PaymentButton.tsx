import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle } from "lucide-react";
import { getPlan, type PlanId } from "@/config/plans";
import { getPlanCheckoutUrl } from "@/config/checkouts";

interface PaymentButtonProps {
  onPaymentSuccess?: () => void;
  planId?: PlanId;
  compact?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ planId = "anual", compact = false }) => {
  const plan = getPlan(planId);
  const checkoutUrl = getPlanCheckoutUrl(planId);

  if (compact) {
    return (
      <Button asChild className="w-full font-bold gap-2">
        <a href={checkoutUrl}>
          <CreditCard className="w-4 h-4" /> Pagar com CN Pay
        </a>
      </Button>
    );
  }

  return (
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

        <Button asChild className="w-full text-lg py-6" size="lg">
          <a href={checkoutUrl}>
            <CreditCard className="h-5 w-5 mr-2" /> Pagar com CN Pay
          </a>
        </Button>

        <p className="text-xs text-center text-muted-foreground">Pagamento seguro processado pela CN Pay</p>
      </CardContent>
    </Card>
  );
};

export default PaymentButton;
