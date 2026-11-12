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

- [x] Estrutura pública: navegação, ordem da home, rota Mais Ferramentas e FAQ.
- [x] Hierarquia visual: dourado nos CTAs e revisão de cores secundárias.
- [x] Fluxo público: preço antes de captura e revisão do checkout visível.
- [x] Revisão final: textos públicos, build e checagem estrutural responsiva por breakpoints Tailwind.

## Extensão aprovada — descrição factual por foto na calculadora

O pedido posterior do proprietário amplia o escopo para a calculadora interna, sem alterar o site público, os pagamentos ou o checkout. A calculadora deve manter os cálculos de custo, frete, imposto e margem, mas utilizar somente o valor real informado pelo usuário para a declaração: não preencher valores aleatórios, não limitar o total e não reescrever o valor digitado. Valores antigos do histórico não devem ser tratados como verificados; ao restaurá-los, limpar os valores de declaração antigos e pedir que sejam informados novamente.

Adicionar, por item, uma opção de enviar uma foto para uma rota isolada da calculadora, usando o mesmo provedor/modelo Gemini visual e segredo já utilizados pela IA do site. Manter a verificação de autenticação e as permissões de plano existentes; não persistir a imagem nem criar tabela ou segredo. Deixar `wolf-chat` intacto para evitar regressões no chat normal. A resposta é uma sugestão editável e copiável de descrição objetiva; não deve adivinhar composição, ocultar marca visível/informada nem orientar a omissão de dados exigidos. Se não houver etiqueta legível, indicar que a composição não pode ser identificada pela foto.

### Arquivos principais

- `src/components/AdvancedPricingCalculator.tsx`: manter os cálculos legítimos e a experiência da calculadora; remover a alteração automática do valor declarado e a camuflagem de marcas/descrições; integrar o novo assistente em cada item e proteger o restauro de históricos antigos.
- `src/components/calculator/ProductDescriptionAssistant.tsx`: upload e prévia de uma foto comprimida, chamada à IA por sessão autenticada, resposta revisável e ação de copiar; não persistir a foto.
- `supabase/functions/product-description/index.ts` e `supabase/config.toml`: disponibilizar a rota dedicada com as verificações existentes de login/plano, sem escrita em banco ou armazenamento da foto.
- `supabase/functions/wolf-chat/index.ts`: manter sem alterações.
- Não alterar `src/config/checkouts.ts`, pagamentos, integrações públicas, esquema do banco ou demais operações de usuário.
