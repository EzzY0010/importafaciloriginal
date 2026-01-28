
# Plano de Implementacao ImportaFacil

## 1. Criar Player Spotify Flutuante

**Arquivo novo:** `src/components/SpotifyPlayer.tsx`

Criar um widget de audio flutuante que simula o Spotify tocando em segundo plano:
- Posicao fixa no rodape (bottom: 0, left: 0, right: 0)
- z-index: 10 (abaixo da barra de busca)
- Design minimalista com controles: play/pause, skip, barra de progresso
- Estado de reproducao simulado com timer
- Estilo visual alinhado com a identidade ImportaFacil (cores azul petroleo e laranja)
- Icone de minimizar/expandir para nao atrapalhar a navegacao

**Integracao:** Adicionar o componente no `Dashboard.tsx` como elemento fixo no rodape.

---

## 2. Correcao de UI e z-index

**Arquivo:** `src/components/WolfChat.tsx`

Ajustes de layering:
- Input area (barra de digitacao): adicionar `z-index: 1000` via classe `z-[1000]`
- Container de mensagens: adicionar `padding-bottom: 120px` para evitar sobreposicao pelo player

**Arquivo:** `src/pages/Dashboard.tsx`

- Adicionar `pb-32` (padding-bottom: 8rem / 128px) no main content quando player estiver visivel
- Garantir que o header mantenha `z-50` (ja configurado)

---

## 3. Ativacao do Garimpo via Foto

**Arquivo:** `src/components/WolfChat.tsx`

Melhorar o fluxo de upload de imagem:
- Quando usuario enviar foto + comandos de garimpo, acionar automaticamente o modo garimpo
- Adicionar indicador visual de "Modo Garimpo Ativo" quando detectado
- Botao de atalho para ativar modo garimpo apos enviar imagem

**Arquivo:** `supabase/functions/wolf-chat/index.ts`

Aprimorar a logica de extracao de keywords:
- Quando houver imagem na conversa E comando de garimpo, forcar a IA a analisar a imagem primeiro
- Extrair palavras-chave especificas do modelo (ex: "Lacoste 5-panel azul" vs "Lacoste Heritage bege")
- Usar modelo Vision para diferenciar variacoes de produtos

---

## 4. Correcao de Links e Renderizacao Real-Time

**Arquivo:** `src/components/WolfChat.tsx`

Criar componente de exibicao de resultados do garimpo:
- Detectar quando mensagem contem resultados de garimpo (links Vinted/eBay)
- Renderizar como cards visuais com:
  - Imagem do produto (se disponivel)
  - Preco atualizado em destaque
  - Link direto clicavel (abre em nova aba)
  - Badge do pais de origem
- Layout em grid responsivo (2 colunas mobile, 3-4 desktop)

**Arquivo:** `supabase/functions/vinted-scraper/index.ts`

Melhorar extracao de dados:
- Extrair URL da imagem dos produtos
- Garantir que todos os links sejam validos e completos
- Adicionar fallback quando Firecrawl nao retornar imagens

---

## 5. Novos Canais: Yupoo e 1688

**Arquivo:** `src/components/WolfChat.tsx`

Adicionar toggles de fonte de busca:
- Toggle "Yupoo" - focado em replicas de alta qualidade (catalogos)
- Toggle "1688" - focado em utensilios e eletronicos
- Armazenar preferencias do usuario no estado local

**Arquivo:** `supabase/functions/wolf-chat/index.ts`

Atualizar SYSTEM_PROMPT:
- Remover descricao fixa do 1688 do topo
- Adicionar logica para IA Jordan dar insights dinamicos apenas quando usuario buscar itens relevantes
- Incluir links Yupoo e 1688 nas sugestoes de compra

Criar mapeamento de canais:
- Yupoo: replicas, roupas de marca, acessorios de luxo
- 1688: eletronicos, utensilios domesticos, ferramentas, itens gerais

---

## 6. Ajuste de Preco: R$12 para R$30

**Arquivo:** `src/components/PaymentButton.tsx`

- Alterar linha 77: `R$ 12,00` para `R$ 30,00`
- Atualizar descricao se necessario

**Arquivo:** `supabase/functions/mercadopago-create-preference/index.ts`

- Linha 51: `amount: 12.00` para `amount: 30.00`
- Linha 63: `unit_price: 12.00` para `unit_price: 30.00`

---

## Arquivos a serem criados/modificados

| Acao | Arquivo |
|------|---------|
| CRIAR | `src/components/SpotifyPlayer.tsx` |
| MODIFICAR | `src/components/WolfChat.tsx` |
| MODIFICAR | `src/pages/Dashboard.tsx` |
| MODIFICAR | `src/components/PaymentButton.tsx` |
| MODIFICAR | `supabase/functions/wolf-chat/index.ts` |
| MODIFICAR | `supabase/functions/mercadopago-create-preference/index.ts` |
| MODIFICAR | `supabase/functions/vinted-scraper/index.ts` |

---

## Ordem de Implementacao

1. Ajuste de preco (rapido, sem dependencias)
2. Player Spotify + correcoes de z-index
3. Melhorias no garimpo via foto
4. Cards de resultados real-time
5. Toggles Yupoo e 1688
6. Testes e deploy das edge functions
