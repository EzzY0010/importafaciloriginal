import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'has_seen_tutorial';

export const startOnboardingTutorial = () => {
  window.dispatchEvent(new CustomEvent('start-onboarding-tutorial'));
};

const OnboardingTutorial: React.FC = () => {
  useEffect(() => {
    // Aguarda até que todos os elementos com data-tour estejam no DOM.
    // Em iOS / desktop com hidratação mais lenta, 400ms pode não ser suficiente.
    const startTour = () => {
      const requiredSelectors = ['[data-tour="whatsapp"]', '[data-tour="ai"]', '[data-tour="calculator"]'];
      const allFound = requiredSelectors.every((sel) => document.querySelector(sel));

      if (!allFound) {
        // Se ainda não renderizou, tenta novamente em 300ms (máx 10 tentativas ≈ 3s)
        return false;
      }

      const driverObj = driver({
        showProgress: true,
        allowClose: false,
        overlayOpacity: 0.75,
        smoothScroll: false,
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Concluir e Começar',
        progressText: '{{current}} de {{total}}',
        onDestroyed: () => {
          localStorage.setItem(STORAGE_KEY, 'true');
        },
        steps: [
          {
            popover: {
              title: 'Seja bem-vindo ao ImportaFacil! 🚀',
              description:
                'Preparamos um tour rápido de 40 segundos para te mostrar como extrair o máximo de lucro da nossa plataforma e acessar nossos benefícios. Vamos lá?',
              nextBtnText: 'Começar Tour',
            },
          },
          {
            element: '[data-tour="whatsapp"]',
            popover: {
              title: 'Nossa Comunidade e Suporte Vitalício! 💬',
              description:
                'Clicando aqui neste ícone do WhatsApp, você entra direto no nosso Grupo de Network exclusivo! Lá você pode interagir com outros membros e, além disso, dentro do grupo você tem acesso direto ao meu contato. Meu suporte para você é 24 horas por dia e 100% vitalício — precisando de qualquer coisa, é só me chamar!',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '[data-tour="ai"]',
            popover: {
              title: 'Sua Mentora de Importação 🤖',
              description:
                'Aqui você tem uma IA avançada e exclusiva, treinada para te ensinar do zero ao avançado. Pode perguntar qualquer coisa para ela: como encontrar os melhores produtos, preencher declarações corretamente, técnicas de vendas, negociação com fornecedores e muito mais. Use sem moderação!',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '[data-tour="calculator"]',
            popover: {
              title: 'Calculadora de Custos Automática 🧮',
              description:
                'Chega de quebrar a cabeça com planilhas! Nessa aba, o sistema trabalha de forma 100% automática. Você só precisa preencher os preços e os números na tela; a calculadora faz todo o resto do cálculo de margem e custos para você num piscar de olhos.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            popover: {
              title: '⚠️ Atenção: Regra de Segurança',
              description:
                'Para a segurança dos seus dados, seu acesso é restrito a apenas 1 dispositivo por vez. Se você for usar no computador, lembre-se de fechar a aba no celular antes (e vice-versa) para evitar bloqueios temporários na conta.',
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
