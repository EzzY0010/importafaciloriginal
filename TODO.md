# TODO — Área pública ImportaFácil

## Estrutura pública

- [x] Criar um menu fixo no topo da home com as âncoras **Como Funciona**, **Ferramentas**, **Planos** e **FAQ**, além do CTA **Entrar**, permitindo que o visitante escolha para onde ir.
- [x] Remover a sequência pública com aparência de página de vendas infinita e organizar a home em blocos independentes, mantendo os cards atuais e a prévia do app mobile.
- [x] Mostrar planos e preços antes de pedir nome, WhatsApp ou e-mail; a captura antecipada não deve aparecer no hero.
- [x] Retirar Spotify e números virtuais SMS da rolagem principal e disponibilizá-los em uma página pública separada chamada **Mais Ferramentas**.
- [ ] Preservar todas as rotas, integrações, autenticação interna, dashboard e pedidos.

## Conteúdo público

- [x] Manter o dourado como cor dos CTAs principais e reduzir a competição visual entre paletas.
- [x] Revisar referências a Yupoo e textos públicos com tradução estranha.
- [x] Adicionar FAQ público com respostas curtas sobre ferramentas, planos, pagamento e acesso.

## Extensão aprovada — Calculadora

- [x] **Descrição por foto:** em cada item da calculadora, permitir selecionar uma foto, enviá-la à IA visual já existente e apresentar uma sugestão objetiva, em português, editável e copiável. Não armazenar a imagem; preservar autenticação e permissões de plano já aplicadas à IA. A sugestão não deve inventar tecido/composição; sem etiqueta legível ou confirmação, deve indicar que a composição não foi identificada. Não ocultar marca visível/informada nem recomendar omissão de dados exigidos em uma declaração. A interface chama uma Edge Function dedicada, isolada do chat normal.
- [x] **Valor declarado real:** aceitar o valor informado pelo usuário sem preenchimento aleatório, teto ou reescrita automática. Nome, custo ou peso não devem alterar esse campo. Total, estimativa de imposto e exportações devem usar o valor informado. Ao restaurar simulação do histórico anterior a esta mudança, limpar os antigos valores de declaração e solicitar novo preenchimento; preservar custo, frete, margem e demais cálculos.
- [x] **Escopo e regressão:** manter o chat de IA, rotas, planos, integrações de pagamento e checkout atuais inalterados; validar build e revisar os arquivos e o diff antes de publicar.
