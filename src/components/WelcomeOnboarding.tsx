import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calculator, RefreshCcw, ArrowRight, Rocket } from 'lucide-react';
import wolfLogo from '@/assets/wolf-logo-clean.png';
import { startOnboardingTutorial } from '@/components/OnboardingTutorial';

const STORAGE_KEY = 'has_seen_welcome_onboarding';

export const startWelcomeOnboarding = () => {
  window.dispatchEvent(new CustomEvent('start-welcome-onboarding'));
};

const steps = [
  {
    icon: MessageSquare,
    title: 'Chat com IA — Lobo das Importações',
    description:
      'Converse com o Lobo para tirar qualquer dúvida sobre importação: produtos, impostos, fornecedores, processos e estratégias.',
    example: 'Ex: "Quanto vou pagar de imposto para importar um celular da China?"',
  },
  {
    icon: Calculator,
    title: 'Calculadora de Importação',
    description:
      'Estime o custo total de uma importação antes de fechar a compra — incluindo impostos, taxas alfandegárias e sua margem de lucro.',
  },
  {
    icon: RefreshCcw,
    title: 'Conversor de Moedas',
    description:
      'Veja o valor atualizado em reais de produtos cotados em outras moedas (dólar, yuan, libra e euro) e compare preços com facilidade.',
  },
  {
    icon: Rocket,
    title: 'Tudo pronto!',
    description:
      'Agora você já conhece as principais ferramentas. Explore o app e comece a importar com inteligência.',
  },
];

const WelcomeOnboarding: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const finish = () => {
    const firstTime = !localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    setStep(0);
    // No primeiro acesso, continua para o tour detalhado das telas
    if (firstTime) startOnboardingTutorial();
  };

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('start-welcome-onboarding', handler);
    return () => window.removeEventListener('start-welcome-onboarding', handler);
  }, []);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center gap-4 pt-2">
          <img src={wolfLogo} alt="ImportaFácil" className="w-16 h-16 rounded-2xl shadow-soft" />

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {current.description}
            </p>
            {current.example && (
              <p className="text-xs italic text-accent mt-3 bg-accent/10 rounded-lg px-3 py-2">
                {current.example}
              </p>
            )}
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex w-full items-center justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={finish} className="text-muted-foreground">
              Pular
            </Button>
            {isLast ? (
              <Button onClick={finish} className="gap-2">
                Começar a usar <Rocket className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeOnboarding;
