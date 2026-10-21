# Plano aprovado — área pública ImportaFácil

## Direção de design

**Movimento:** SaaS premium enxuto, com navegação orientada à tarefa e o dourado como assinatura visual.

**Princípios:** clareza antes de persuasão; preço visível antes da captura; uma ação principal por tela; conteúdo modular em vez de rolagem de vendas.

**Paleta:** manter o fundo escuro e usar o dourado como cor própria dos CTAs principais. Verde fica restrito a marcas ou contextos específicos fora do produto principal.

**Layout:** navegação fixa com âncoras e blocos de conteúdo independentes, mantendo os cards atuais e a prévia mobile como referência.

**Tom:** direto, confiante e prático. Exemplo: “Importe com contexto, não no escuro.” / “Veja as ferramentas e escolha o próximo passo.”

## Escopo aprovado

Alterar somente a área pública. Não modificar dashboard, pedidos, autenticação interna, webhooks, banco ou integrações de pagamento.

1. Criar navegação pública fixa com Como Funciona, Ferramentas, Planos, FAQ e Entrar.
2. Remover a captura de nome, WhatsApp e e-mail do hero; planos e preços aparecem antes de qualquer captura.
3. Separar Spotify e números virtuais em uma rota pública Mais Ferramentas.
4. Unificar CTAs públicos principais com dourado, mantendo cores de marca somente em contextos próprios.
5. Revisar textos públicos e neutralizar a referência a Yupoo.
6. Manter os cards, a prévia mobile, rotas e integrações existentes.

## Estrutura de projeto

- `src/pages/LandingPage.tsx`: home pública, navegação, proposta de valor, prévia, planos e FAQ.
- `src/pages/MoreTools.tsx`: Spotify e números virtuais, separados da home.
- `src/components/LeadCaptureInline.tsx`: permanece disponível para fluxos que ainda o utilizem, mas não será renderizado no hero.
- `src/App.tsx`: registra a rota pública `/ferramentas`.
- `src/components/PaymentButton.tsx` e `src/config/checkouts.ts`: preservados, sem alteração de integração.

## Etapas

- [ ] Estrutura pública: navegação, ordem da home, rota Mais Ferramentas e FAQ.
- [ ] Hierarquia visual: dourado nos CTAs e revisão de cores secundárias.
- [ ] Fluxo público: preço antes de captura e revisão do checkout visível.
- [ ] Revisão final: textos públicos, build e inspeção responsiva.
