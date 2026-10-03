import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { getSupabaseClient } from '@/lib/backend';
import { PLANS, getPlan, type PlanId } from '@/config/plans';

interface PaymentButtonProps {
  onPaymentSuccess?: () => void;
  planId?: PlanId;
  compact?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ onPaymentSuccess, planId = 'anual', compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const plan = getPlan(planId);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', document: '' });
  const [pix, setPix] = useState<{ code: string; expiresAt: string | null } | null>(null);

  const handlePayment = () => { setPix(null); setOpen(true); };

  const generatePix = async () => {
    setIsLoading(true);
    try {
      const client = await getSupabaseClient();
      const session = client ? (await client.auth.getSession()).data.session : null;
      if (!client || !session) {
        toast({ title: 'Erro', description: 'Você precisa estar logado para fazer o pagamento', variant: 'destructive' });
        return;
      }
      const { data, error } = await client.functions.invoke('appcnpay-pix', { body: { planId: plan.id, ...form } });
      if (error || !data?.code) {
        let msg = 'Não foi possível gerar o Pix, tente novamente.';
        try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      setPix({ code: data.code, expiresAt: data.expiresAt });
    } catch (e) {
      toast({ title: 'Erro no Pix', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const pixDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Pagar {plan.name} via Pix</DialogTitle></DialogHeader>
        <p className="text-2xl font-extrabold text-center">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
        {!pix ? (
          <div className="space-y-2">
            <Input placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="CPF" inputMode="numeric" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
            <Input placeholder="WhatsApp (11) 99999-9999" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Button className="w-full" onClick={generatePix} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar Pix'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div className="bg-card p-3 rounded-xl inline-block border"><QRCodeSVG value={pix.code} size={200} /></div>
            <Button variant="outline" className="w-full gap-2" onClick={() => { navigator.clipboard.writeText(pix.code); toast({ title: 'Código Pix copiado!' }); }}>
              <Copy className="w-4 h-4" /> Copiar código Pix
            </Button>
            <p className="text-xs text-muted-foreground">Após pagar, seu acesso é liberado automaticamente em instantes.</p>
            <Button className="w-full" onClick={() => { setOpen(false); onPaymentSuccess?.(); }}>Já paguei</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (compact) {
    return (
      <>
      {pixDialog}
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full font-bold gap-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Assinar {plan.name}</>}
      </Button>
      </>
    );
  }

  return (
    <>
    {pixDialog}
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
          Pagamento seguro via Pix
        </p>
      </CardContent>
    </Card>
    </>
  );
};

export default PaymentButton;
