import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calculator, Camera, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    icon: <MessageSquare className="w-8 h-8 text-secondary" />,
    title: '🐺 Lobo das Importações',
    desc: 'Seu assistente de IA especializado. Ele analisa produtos por foto, identifica marcas, sugere canais de compra e monta estratégias de importação.',
  },
  {
    icon: <Camera className="w-8 h-8 text-accent" />,
    title: '📸 Modo Perícia',
    desc: 'Envie a foto de qualquer produto e o Lobo faz um raio-X completo: marca, material, peso estimado, preço de referência e dicas de revenda.',
  },
  {
    icon: <Calculator className="w-8 h-8 text-secondary" />,
    title: '🧮 Calculadora Pro',
    desc: 'Calcule custos de importação com cotações em tempo real. Suporta múltiplas moedas, frete rateado e camuflagem automática de declaração.',
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-accent" />,
    title: '💰 Lucro Garantido',
    desc: 'Defina sua margem de lucro e veja o preço de venda ideal. O sistema calcula impostos, frete e custo final automaticamente.',
  },
];

const STORAGE_KEY = 'importafacil_onboarding_done';

const OnboardingTutorial: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-sm text-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            {STEPS[step].icon}
          </div>
          <h3 className="text-lg font-bold">{STEPS[step].title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{STEPS[step].desc}</p>

          {/* Progress dots */}
          <div className="flex gap-2 my-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>

          <div className="flex gap-3 w-full">
            {step > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
                Voltar
              </Button>
            )}
            {isLast ? (
              <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-bold" onClick={finish}>
                Entendi! Iniciar Minha Caçada 🐺
              </Button>
            ) : (
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => setStep(s => s + 1)}>
                Próximo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTutorial;
