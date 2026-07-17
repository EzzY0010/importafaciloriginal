import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/backend';
import { PLANS, getPlan, type PlanId } from '@/config/plans';

interface PaymentButtonProps {
  onPaymentSuccess?: () => void;
  planId?: PlanId;
  compact?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ onPaymentSuccess, planId = 'vitalicio', compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const plan = getPlan(planId);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const client = await getSupabaseClient();
      if (!client) {
        toast({
          title: 'Erro',
          description: 'Backend indisponível no momento',
          variant: 'destructive'
        });
        return;
      }

      const { data: { session } } = await client.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para fazer o pagamento',
          variant: 'destructive'
        });
        return;
      }

      const response = await client.functions.invoke('mercadopago-create-preference', {
        body: { planId: plan.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { init_point, sandbox_init_point } = response.data;
      
      // Use sandbox for testing, init_point for production
      const paymentUrl = init_point || sandbox_init_point;
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error('Erro ao gerar link de pagamento');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full font-bold gap-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Assinar {plan.name}</>}
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
        <CardDescription>
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>🔥 Oferta por tempo limitado</p>
          <p className="text-4xl font-extrabold mt-1 text-foreground">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{plan.period}</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Estrategista 24h: Tire dúvidas sobre impostos, fretes e regras.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Simulador de Lucro: Saiba quanto vai pagar antes de encomendar.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Análise Técnica: Identifique detalhes do produto por foto.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Histórico Salvo: Suas perguntas e planos ficam guardados.</span>
          </div>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={isLoading}
          className="w-full text-lg py-6"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              GARANTIR MINHA VAGA
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Pagamento seguro via Mercado Pago
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentButton;
