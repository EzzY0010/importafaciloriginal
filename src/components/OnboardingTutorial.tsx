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
      const requiredSelectors = [
        '[data-tour="whatsapp"]',
        '[data-tour="ai"]',
        '[data-tour="calculator"]',
        '[data-tour="topbar"]',
        '[data-tour="chat-area"]',
        '[data-tour="chat-image"]',
        '[data-tour="chat-input"]',
        '[data-tour="chat-send"]',
      ];
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
            element: '[data-tour="chat-area"]',
            popover: {
              title: 'Lobo das Importações 🤖',
              description:
                'Este é o Lobo das Importações, sua IA especializada para análise completa de produtos e conversão de moedas.',
              side: 'left',
              align: 'center',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="chat-area"]',
            popover: {
              title: 'Exemplos de comandos 💡',
              description:
                "Você pode dar comandos diretos para a IA! Experimente perguntar coisas como: 'Qual é o peso médio desse produto?', 'Como eu acho fornecedores para estas peças no exterior?', 'Qual a melhor estratégia de revenda para esse item?' ou pedir dicas de precificação.",
              side: 'left',
              align: 'center',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="chat-image"]',
            popover: {
              title: 'Envie uma foto 📸',
              description:
                'Clique aqui para enviar a foto de um produto. A IA lerá a imagem e trará na hora a Ficha Técnica com marca, peso estimado, composição e insights de mercado.',
              side: 'top',
              align: 'start',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="chat-input"]',
            popover: {
              title: 'Campo de texto e moeda 💬',
              description:
                "Aqui você digita suas dúvidas ou insere diretamente um valor em moeda estrangeira (ex: '$50' ou '50 USD') para que a IA faça a conversão direta e te dê o valor convertido.",
              side: 'top',
              align: 'center',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="chat-send"]',
            popover: {
              title: 'Botão Enviar 🚀',
              description:
                'Clique aqui para enviar sua mensagem ou imagem e receber a resposta do Lobo.',
              side: 'top',
              align: 'end',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="calculator"]',
            popover: {
              title: 'Calculadora de Importação 🧮',
              description:
                'Agora vamos para a Calculadora. Clique nesta aba (ou avance) para simular custos reais, taxas alfandegárias e margem de lucro.',
              side: 'bottom',
              align: 'center',
            },
            onHighlightStarted: () => setTab('calculator'),
          },
          {
            element: '[data-tour="calc-root"]',
            popover: {
              title: 'Visão geral da Calculadora 📊',
              description:
                'Esta é a sua ferramenta matemática para simular custos reais de importação antes de fechar qualquer negócio.',
              side: 'left',
              align: 'start',
            },
            onHighlightStarted: () => setTab('calculator'),
          },
          {
            element: '[data-tour="calc-inputs"]',
            popover: {
              title: 'Campos de entrada 📝',
              description:
                'Preencha cada campo com atenção: valor do produto, frete internacional estimado, declaração e margem desejada. Quanto mais precisos os dados, mais real será o custo final calculado.',
              side: 'bottom',
              align: 'start',
            },
            onHighlightStarted: () => setTab('calculator'),
          },
          {
            element: '[data-tour="calc-results"]',
            popover: {
              title: 'Resultado e margem 💰',
              description:
                'A calculadora atualiza automaticamente o Investimento, Faturamento e Lucro Total. Use a margem projetada para decidir se vale a pena importar o produto.',
              side: 'top',
              align: 'center',
            },
            onHighlightStarted: () => setTab('calculator'),
          },
          {
            element: '[data-tour="whatsapp"]',
            popover: {
              title: 'Suporte no WhatsApp 💬',
              description:
                'Precisa de suporte humano? Este ícone destaca o nosso canal direto com o suporte administrativo (não se preocupe, não vamos clicar nele agora).',
              side: 'bottom',
              align: 'end',
            },
            onHighlightStarted: () => setTab('chat'),
          },
          {
            element: '[data-tour="topbar"]',
            popover: {
              title: 'Idioma e Perfil ⚙️',
              description:
                'Por aqui você altera o idioma de preferência do sistema (PT / EN) e acompanha o status e o nível da sua conta de forma rápida.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            popover: {
              title: 'Aviso Importante: Como acessar as Fontes e Redirecionadoras 🌐',
              description: `
                <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;line-height:1.5;">
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                    <div style="font-weight:700;margin-bottom:4px;">📋 A lista de nomes já está com você</div>
                    <div style="color:#475569;">Dentro da nossa plataforma, você tem acesso aos nomes das melhores fontes de produtos e das empresas redirecionadoras mais seguras do mercado.</div>
                  </div>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
                    <div style="font-weight:700;margin-bottom:4px;">🔍 Copie o nome e jogue no Google</div>
                    <div style="color:#475569;">O nosso site funciona estritamente como sua ferramenta de cálculo e análise, por isso <strong>não fornecemos links clicáveis</strong>. Para acessar qualquer fornecedor ou redirecionadora da lista, basta copiar o nome, abrir o Google no seu navegador e pesquisar por ele.</div>
                  </div>
                  <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;border-radius:12px;padding:12px 14px;font-weight:600;">
                    Simples assim! Use a lista para saber em quem confiar, o Google para acessar os sites, e o Lobo com a Calculadora para validar seus lucros.
                  </div>
                </div>
              `,
              doneBtnText: 'Entendi, vamos começar! 🚀',
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
