import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Rocket, Sparkle } from 'lucide-react';
import wolfLogo from '@/assets/wolf-logo-clean.png';
import { getSupabase } from '@/lib/backend';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'has_done_interactive_tutorial';

export const startInteractiveOnboarding = () => {
  window.dispatchEvent(new CustomEvent('start-interactive-onboarding'));
};

const setTab = (tab: 'chat' | 'calculator') => {
  window.dispatchEvent(new CustomEvent('tutorial-set-tab', { detail: tab }));
};

type SubStep = {
  selector: string;
  title: string;
  text: string;
  suggestion?: string;
  /** quando true, o "Próximo" só libera após a prática ser concluída */
  practice?: boolean;
};

type Step = {
  id: 'chat' | 'calculator' | 'converter';
  tab: 'chat' | 'calculator';
  subSteps: SubStep[];
  success: string;
};

const STEPS: Step[] = [
  {
    id: 'chat',
    tab: 'chat',
    success: 'Boa! Você já sabe conversar com o Lobo. 🐺',
    subSteps: [
      {
        selector: '[data-tour="chat-input"]',
        title: 'Digite sua primeira pergunta aqui',
        text: 'Toque na sugestão abaixo para preencher automaticamente — ou escreva sua própria dúvida.',
        suggestion: 'Quanto pago de imposto para importar um celular?',
        practice: true,
      },
    ],
  },
  {
    id: 'calculator',
    tab: 'calculator',
    success: 'Boa! Você já sabe simular uma importação. 🧮',
    subSteps: [
      {
        selector: '[data-tour="calc-inputs"]',
        title: 'Frete internacional',
        text: 'Escolha a moeda e digite um valor de exemplo, como 20.',
      },
      {
        selector: '[data-tour="calc-root"]',
        title: 'Preencha um produto',
        text: 'Escreva o nome do item e o valor de compra (ex: 50). O resultado aparece sozinho, sem botão.',
        practice: true,
      },
    ],
  },
  {
    id: 'converter',
    tab: 'calculator',
    success: 'Boa! Agora você compara preços em qualquer moeda. 💱',
    subSteps: [
      {
        selector: '[data-tour="converter"]',
        title: 'Converta ao vivo',
        text: 'Digite um valor em dólar, euro, libra ou yuan e veja as outras moedas mudarem na hora.',
        practice: true,
      },
    ],
  },
];

const PAD = 8;

const InteractiveOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const startedRef = useRef(false);

  const step = STEPS[stepIdx];
  const sub = step?.subSteps[subIdx];

  const persistDone = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    if (!user) return;
    try {
      const client = await getSupabase();
      if (client) {
        await client
          .from('profiles')
          .update({ interactive_tutorial_done: true } as never)
          .eq('id', user.id);
      }
    } catch {
      /* silencioso — o localStorage já garante */
    }
  }, [user]);

  const close = useCallback(() => {
    setRunning(false);
    setFinished(false);
    setStepIdx(0);
    setSubIdx(0);
    setDone(false);
    setFeedback(null);
    persistDone();
  }, [persistDone]);

  const begin = useCallback(() => {
    setStepIdx(0);
    setSubIdx(0);
    setDone(false);
    setFeedback(null);
    setFinished(false);
    setTab('chat');
    setRunning(true);
  }, []);

  /* auto-start no primeiro acesso */
  useEffect(() => {
    if (startedRef.current) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    startedRef.current = true;
    const t = setTimeout(begin, 900);
    return () => clearTimeout(t);
  }, [begin]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(STORAGE_KEY);
      begin();
    };
    window.addEventListener('start-interactive-onboarding', handler);
    return () => window.removeEventListener('start-interactive-onboarding', handler);
  }, [begin]);

  /* troca de aba a cada etapa */
  useEffect(() => {
    if (!running || finished || !step) return;
    setTab(step.tab);
  }, [running, finished, stepIdx, step]);

  /* acompanha a posição do elemento destacado */
  useEffect(() => {
    if (!running || finished || !sub) {
      setRect(null);
      return;
    }
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(sub.selector) as HTMLElement | null;
      if (el) {
        if (!scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [running, finished, sub]);

  /* detecção da prática concluída */
  useEffect(() => {
    if (!running || finished || !sub?.practice || done) return;

    if (step.id === 'chat') {
      const onAnswer = () => setDone(true);
      window.addEventListener('wolf-chat-answered', onAnswer);
      return () => window.removeEventListener('wolf-chat-answered', onAnswer);
    }

    const interval = window.setInterval(() => {
      if (step.id === 'calculator') {
        if (document.querySelector('[data-tour="calc-results"]')) setDone(true);
      } else if (step.id === 'converter') {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-tour="converter"] input');
        if (Array.from(inputs).some((i) => i.value.trim() !== '')) setDone(true);
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [running, finished, sub, step, done]);

  /* feedback positivo ao concluir a prática */
  useEffect(() => {
    if (done && step) setFeedback(step.success);
  }, [done, step]);

  const goNext = () => {
    setFeedback(null);
    if (subIdx < step.subSteps.length - 1) {
      setSubIdx((s) => s + 1);
      return;
    }
    setDone(false);
    setSubIdx(0);
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((s) => s + 1);
    } else {
      setFinished(true);
    }
  };

  if (!running) return null;

  /* tela final */
  if (finished) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center bg-card border border-border rounded-3xl shadow-strong p-8 animate-fade-in">
          <img src={wolfLogo} alt="ImportaFácil" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-soft" />
          <h2 className="text-xl font-bold text-foreground">Você já sabe usar o ImportaFácil!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Chat com o Lobo, calculadora de importação e conversor de moedas na palma da mão.
          </p>
          <Button className="w-full mt-6 gap-2" onClick={close}>
            Começar a usar <Rocket className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const r = rect;
  const holeTop = r ? Math.max(r.top - PAD, 0) : 0;
  const holeLeft = r ? Math.max(r.left - PAD, 0) : 0;
  const holeW = r ? r.width + PAD * 2 : 0;
  const holeH = r ? r.height + PAD * 2 : 0;

  const placeBelow = r ? holeTop + holeH < window.innerHeight - 260 : true;
  const cardStyle: React.CSSProperties = r
    ? placeBelow
      ? { top: holeTop + holeH + 12, left: 12, right: 12 }
      : { bottom: window.innerHeight - holeTop + 12, left: 12, right: 12 }
    : { top: '30%', left: 12, right: 12 };

  const overlay = 'fixed bg-[hsl(220_60%_8%/0.78)] transition-all duration-200';

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Spotlight: 4 painéis escuros ao redor do elemento ativo */}
      {r ? (
        <>
          <div className={overlay} style={{ top: 0, left: 0, right: 0, height: holeTop }} />
          <div className={overlay} style={{ top: holeTop + holeH, left: 0, right: 0, bottom: 0 }} />
          <div className={overlay} style={{ top: holeTop, left: 0, width: holeLeft, height: holeH }} />
          <div className={overlay} style={{ top: holeTop, left: holeLeft + holeW, right: 0, height: holeH }} />
          <div
            className="fixed rounded-2xl ring-4 ring-accent shadow-[0_0_0_9999px_rgba(0,0,0,0)] pointer-events-none animate-pulse"
            style={{ top: holeTop, left: holeLeft, width: holeW, height: holeH }}
          />
        </>
      ) : (
        <div className={overlay} style={{ inset: 0 }} />
      )}

      {/* Card de instrução */}
      <div
        className="fixed pointer-events-auto mx-auto max-w-md bg-card border border-border rounded-2xl shadow-strong p-4 animate-fade-in"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <img src={wolfLogo} alt="" className="w-9 h-9 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
              Passo {stepIdx + 1} de {STEPS.length}
            </p>
            <h3 className="text-sm font-bold text-foreground mt-0.5">{sub?.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sub?.text}</p>

            {sub?.suggestion && !done && (
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('onboarding-fill-chat', { detail: sub.suggestion })
                  );
                }}
                className="mt-3 w-full text-left text-xs bg-accent/10 hover:bg-accent/20 text-accent-foreground/90 border border-accent/30 rounded-xl px-3 py-2 transition-colors flex items-center gap-2"
              >
                <Sparkle className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="truncate">"{sub.suggestion}"</span>
              </button>
            )}

            {feedback && (
              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {feedback}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={close}>
            Pular tutorial
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!!sub?.practice && !done}
            onClick={goNext}
          >
            {stepIdx === STEPS.length - 1 && subIdx === step.subSteps.length - 1 ? 'Concluir' : 'Próximo'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {sub?.practice && !done && (
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Faça a ação acima para liberar o "Próximo"
          </p>
        )}
      </div>
    </div>
  );
};

export default InteractiveOnboarding;
