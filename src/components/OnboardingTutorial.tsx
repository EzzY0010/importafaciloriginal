import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import wolfLogo from '@/assets/wolf-logo-clean.png';

const STEPS = [
  {
    emoji: '🐺',
    title: 'Bem-vindo ao ImportaFácil',
    desc: 'Prepare-se para operar com o que há de melhor no mercado de importações. Vamos te mostrar como dominar cada ferramenta.',
    isWelcome: true,
  },
  {
    emoji: '🤖',
    title: 'IA Especialista — Import Wolf',
    desc: 'Na aba "Import Wolf" está sua IA Especialista em vendas e importação. Ela reconhece fotos de qualquer produto, fornece detalhamento completo, peso estimado e te dá o caminho das pedras com palavras-chave para garimpo.',
  },
  {
    emoji: '💱',
    title: 'Calculadora e Conversor em Tempo Real',
    desc: 'Nossa Calculadora Automatizada possui conversor de moedas que atualiza a cada 3 segundos. Insira seus custos e veja a mágica acontecer sem precisar sair do app.',
  },
  {
    emoji: '📈',
    title: 'Estratégia de Drop e Margem',
    desc: 'Defina seu lucro! O sistema sugere ideias de margem e gera automaticamente a declaração para você apenas copiar e colar na sua operação.',
  },
  {
    emoji: '📦',
    title: 'Lista de Itens — O seu Drop',
    desc: 'Gerencie todo o seu drop aqui. Saiba exatamente quanto vai gastar em toda a operação, item por item, com organização profissional.',
  },
  {
    emoji: '🌍',
    title: 'Fontes e Redirecionadoras',
    desc: 'Tenha acesso a mais de 5 fontes de garimpo mundiais e as 3 melhores redirecionadoras do mercado integradas à nossa visão estratégica.',
  },
  {
    emoji: '💬',
    title: 'Suporte 24h',
    desc: 'Dúvidas? Suporte 24h direto comigo pelo WhatsApp (ícone verde no topo) para garantir que você faça parte do time de sucesso.',
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
  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="max-w-sm text-center p-6" translate="no" lang="pt-BR">
        <div className="flex flex-col items-center gap-4">
          {current.isWelcome ? (
            <img src={wolfLogo} alt="ImportaFácil" className="w-20 h-20 rounded-2xl" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
              {current.emoji}
            </div>
          )}
          <h3 className="text-lg font-bold">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 my-2">
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
                INICIAR MINHA JORNADA AGORA 🐺
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
