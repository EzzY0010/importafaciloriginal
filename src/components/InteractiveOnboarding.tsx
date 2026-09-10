import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Rocket, Sparkle } from 'lucide-react';
import wolfLogo from '@/assets/wolf-logo-clean.png';
import { getSupabaseClient } from '@/lib/backend';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'has_done_interactive_tutorial';

export const startInteractiveOnboarding = () => {
  window.dispatchEvent(new CustomEvent('start-interactive-onboarding'));
};

const setTab = (tab: 'home' | 'chat' | 'calculator') => {
  window.dispatchEvent(new CustomEvent('tutorial-set-tab', { detail: tab }));
};

type Step = {
  id: string;
  tab: 'home' | 'chat' | 'calculator';
  selector: string;
  title: string;
  text: string;
  suggestion?: string;
  /** prática obrigatória: só libera "Próximo" depois da ação */
  practice?: 'chat' | 'calculator' | 'converter';
  success?: string;
};

const STEPS: Step[] = [
  {
    id: 'chat-input',
    tab: 'chat',
    selector: '[data-tour="chat-input"]',
    title: 'Digite sua primeira pergunta aqui',
    text: 'Toque na sugestão abaixo para preencher automaticamente — ou escreva sua própria dúvida e envie.',
    suggestion: 'Quanto pago de imposto para importar um celular?',
    practice: 'chat',
    success: 'Boa! Você já sabe conversar com o Lobo. 🐺',
  },
  {
    id: 'chat-image',
    tab: 'chat',
    selector: '[data-tour="chat-image"]',
    title: 'Enviar foto do produto',
    text: 'Esta câmera serve para mandar a foto de um produto e receber a análise dele — é diferente de perguntar por texto.',
  },
  {
    id: 'calc-inputs',
    tab: 'calculator',
    selector: '[data-tour="calc-inputs"]',
    title: 'Frete internacional',
    text: 'Escolha a moeda e digite um valor de exemplo, como 20.',
  },
  {
    id: 'calc-root',
    tab: 'calculator',
    selector: '[data-tour="calc-root"]',
    title: 'Preencha um produto',
    text: 'Escreva o nome do item e o valor de compra (ex: 50). O resultado aparece sozinho, sem botão.',
    practice: 'calculator',
    success: 'Boa! Você já sabe simular uma importação. 🧮',
  },
  {
    id: 'converter',
    tab: 'calculator',
    selector: '[data-tour="converter"]',
    title: 'Converta ao vivo',
    text: 'Digite um valor em dólar, euro, libra ou yuan e veja as outras moedas mudarem na hora.',
    practice: 'converter',
    success: 'Boa! Agora você compara preços em qualquer moeda. 💱',
  },
  {
    id: 'nav-home',
    tab: 'calculator',
    selector: '[data-tour="nav-home"]',
    title: 'Início',
    text: 'Volta para a tela principal, com os atalhos das funções mais usadas.',
  },
  {
    id: 'nav-ai',
    tab: 'calculator',
    selector: '[data-tour="ai"]',
    title: 'IA Lobo',
    text: 'Abre o chat com o Lobo das Importações para tirar dúvidas e analisar produtos.',
  },
  {
    id: 'nav-sources',
    tab: 'calculator',
    selector: '[data-tour="quick-access"]',
    title: 'Fornecedores',
    text: 'Lista de lojas confiáveis e redirecionadoras para comprar e receber no Brasil.',
  },
  {
    id: 'nav-calc',
    tab: 'calculator',
    selector: '[data-tour="calculator"]',
    title: 'Calculadora',
    text: 'Atalho para a calculadora de custos e o conversor de moedas.',
  },
  {
    id: 'nav-profile',
    tab: 'calculator',
    selector: '[data-tour="nav-profile"]',
    title: 'Perfil',
    text: 'Abre o seu menu: idioma, ajuda e sair da conta.',
  },
  {
    id: 'bell',
    tab: 'calculator',
    selector: '[data-tour="bell"]',
    title: 'Notificações',
    text: 'O sininho avisa sobre novidades, avisos e atualizações do app.',
  },
  {
    id: 'whatsapp',
    tab: 'calculator',
    selector: '[data-tour="whatsapp"]',
    title: 'Comunidade no WhatsApp',
    text: 'Entra no grupo para falar com o suporte e com outros importadores.',
  },
  {
    id: 'menu',
    tab: 'calculator',
    selector: '[data-tour="menu"]',
    title: 'Menu',
    text: 'Aqui ficam idioma, "Ajuda / Como usar" (para rever este tutorial) e sair da conta.',
  },
];

const PAD = 8;

const InteractiveOnboarding: React.FC = () => {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const startedRef = useRef(false);

  const step = STEPS[stepIdx];

  const persistDone = useCallback(async () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    if (!user) return;
    try {
      const client = await getSupabaseClient();
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
    setDone(false);
    setFeedback(null);
    persistDone();
  }, [persistDone]);

  const begin = useCallback(() => {
    setStepIdx(0);
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
    if (!running || finished || !step) {
      setRect(null);
      return;
    }
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
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
  }, [running, finished, step]);

  /* detecção da prática concluída */
  useEffect(() => {
    if (!running || finished || !step?.practice || done) return;

    if (step.practice === 'chat') {
      const onAnswer = () => setDone(true);
      window.addEventListener('wolf-chat-answered', onAnswer);
      return () => window.removeEventListener('wolf-chat-answered', onAnswer);
    }

    const interval = window.setInterval(() => {
      if (step.practice === 'calculator') {
        if (document.querySelector('[data-tour="calc-results"]')) setDone(true);
      } else if (step.practice === 'converter') {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-tour="converter"] input');
        if (Array.from(inputs).some((i) => i.value.trim() !== '')) setDone(true);
      }
    }, 500);
    return () => window.clearInterval(interval);
  }, [running, finished, step, done]);

  /* feedback positivo ao concluir a prática */
  useEffect(() => {
    if (done && step?.success) setFeedback(step.success);
  }, [done, step]);

  const goNext = () => {
    setFeedback(null);
    setDone(false);
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
            Chat com o Lobo, calculadora de importação, conversor de moedas e todos os atalhos na palma da mão.
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
            <h3 className="text-sm font-bold text-foreground mt-0.5">{step?.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step?.text}</p>

            {step?.suggestion && !done && (
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('onboarding-fill-chat', { detail: step.suggestion })
                  );
                }}
                className="mt-3 w-full text-left text-xs bg-accent text-accent-foreground font-semibold border border-accent rounded-xl px-3 py-2 transition-opacity hover:opacity-90 flex items-center gap-2 shadow-soft"
              >
                <Sparkle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">"{step.suggestion}"</span>
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
            disabled={!!step?.practice && !done}
            onClick={goNext}
          >
            {stepIdx === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {step?.practice && !done && (
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Faça a ação acima para liberar o "Próximo"
          </p>
        )}
      </div>
    </div>
  );
};

export default InteractiveOnboarding;
