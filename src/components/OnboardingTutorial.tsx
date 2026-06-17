import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'has_seen_tutorial';

export const startOnboardingTutorial = () => {
  window.dispatchEvent(new CustomEvent('start-onboarding-tutorial'));
};

const setTab = (tab: 'chat' | 'calculator') => {
  window.dispatchEvent(new CustomEvent('tutorial-set-tab', { detail: tab }));
};

const OnboardingTutorial: React.FC = () => {
  useEffect(() => {
    // Aguarda até que todos os elementos com data-tour estejam no DOM.
    // Em iOS / desktop com hidratação mais lenta, 400ms pode não ser suficiente.
    const startTour = () => {
      const requiredSelectors = ['[data-tour="whatsapp"]', '[data-tour="ai"]', '[data-tour="calculator"]', '[data-tour="topbar"]'];
      const allFound = requiredSelectors.every((sel) => document.querySelector(sel));

      if (!allFound) {
        // Se ainda não renderizou, tenta novamente em 300ms (máx 10 tentativas ≈ 3s)
        return false;
      }

      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        overlayOpacity: 0.75,
        smoothScroll: false,
        nextBtnText: 'Avançar',
        prevBtnText: 'Voltar',
        doneBtnText: 'Finalizar Tour',
        progressText: '{{current}} de {{total}}',
        showButtons: ['next', 'previous', 'close'],
        disableActiveInteraction: true,
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, 'true');
          setTab('chat');
        },
        steps: [
          {
            popover: {
              title: 'Bem-vindo ao ImportaFacil! 🚀',
              description:
                'Vamos fazer um tour rápido para você conhecer todas as nossas ferramentas de importação.',
              nextBtnText: 'Começar Tour',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="ai"]',
            popover: {
              title: 'Lobo das Importações 🤖',
              description:
                'Este é o Lobo das Importações! Aqui você pode enviar a foto de qualquer produto para receber uma análise completa (marca, peso, composição e dicas de revenda) ou digitar um valor em moeda estrangeira para conversão direta.',
              side: 'bottom',
              align: 'center',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="calculator"]',
            popover: {
              title: 'Calculadora de Importação 🧮',
              description:
                'Ao clicar aqui, você acessa a nossa Calculadora. Use-a para simular custos, taxas alfandegárias e margem de lucro dos seus produtos importados de forma simples!',
              side: 'bottom',
              align: 'center',
            },
            onHighlightStarted: () => setTab('calculator'),
          },
          {
            element: '[data-tour="whatsapp"]',
            popover: {
              title: 'Suporte no WhatsApp 💬',
              description:
                'Precisa de ajuda humana? Clique no ícone do WhatsApp no topo para falar diretamente com o nosso suporte administrativo a qualquer momento.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '[data-tour="topbar"]',
            popover: {
              title: 'Idioma e Perfil ⚙️',
              description:
                'Aqui no topo você pode alternar o idioma do sistema entre Português e Inglês, ver o seu nível de acesso e gerenciar sua conta.',
              side: 'bottom',
              align: 'end',
            },
          },
        ],
      });

      driverObj.drive();
      return true;
    };

    const launchWithRetry = () => {
      let attempts = 0;
      const maxAttempts = 20;
      const tryStart = () => {
        if (startTour()) return;
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryStart, 300);
        }
      };
      setTimeout(tryStart, 600);
    };

    // Auto-start on first visit (per device, since localStorage is per-device)
    const autoStart = !localStorage.getItem(STORAGE_KEY);
    if (autoStart) launchWithRetry();

    // Manual replay trigger — funciona em Android, iOS e desktop
    const handleManualStart = () => {
      localStorage.removeItem(STORAGE_KEY);
      launchWithRetry();
    };
    window.addEventListener('start-onboarding-tutorial', handleManualStart);
    return () => window.removeEventListener('start-onboarding-tutorial', handleManualStart);
  }, []);

  return null;
};

export default OnboardingTutorial;
