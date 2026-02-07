import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

interface PaymentButtonProps {
  onPaymentSuccess?: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para fazer o pagamento',
          variant: 'destructive'
        });
        return;
      }

      const response = await supabase.functions.invoke('mercadopago-create-preference', {
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <CreditCard className="h-6 w-6" />
          Liberar Acesso
        </CardTitle>
        <CardDescription>
          Pagamento único para acesso vitalício
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-muted rounded-lg">
          <p className="text-5xl font-extrabold text-gold">R$ 30,00</p>
          <p className="text-sm text-muted-foreground mt-1">Pagamento único</p>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>IA Lobo das Importações ilimitada</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Calculadora de importação completa</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Análise de imagens de produtos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Histórico de conversas salvo</span>
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
              Pagar com Mercado Pago
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
