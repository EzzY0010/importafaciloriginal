
# Plano — Foco no Sistema do Lobo (Import Wolf)

Vou aplicar apenas as melhorias relacionadas ao chat do Lobo agora. As demais (calculadora, login/recuperação de senha, lazy loading global) ficam para etapas seguintes.

## 1. Estabilidade da chamada à IA (Edge Function `wolf-chat`)

**Arquivo:** `supabase/functions/wolf-chat/index.ts`

- Adicionar `console.error` detalhado com status HTTP, corpo da resposta e tipo de erro (401 / 429 / 402 / 500 / timeout) do AI Gateway, para diagnóstico via logs.
- Envelopar a chamada `fetch` ao gateway com `AbortController` e timeout de **15s** para não deixar a requisição pendurada.
- Retornar códigos e mensagens específicas ao frontend:
  - `429` → "rate_limit"
  - `402` → "quota_exhausted"
  - `408` (timeout) → "timeout"
  - `401/403` → "auth_error"
  - `>=500` → "upstream_error"

## 2. Frontend do Chat (`src/components/WolfChat.tsx`)

### 2a. Tratamento de erros amigável e fallback do input
- No `catch` do `sendMessage`, ler `response.status` e exibir a mensagem específica:
  - Global/500/timeout: **"O sistema de Inteligência Artificial está temporariamente instável. Estamos reconectando..."**
  - 429: "Muitas requisições. Aguarde alguns segundos e tente novamente."
  - 402: "Cota de IA esgotada. Contate o suporte."
- Adicionar `console.error` completo (status, statusText, body) para inspeção no DevTools.
- Garantir `setIsLoading(false)` no `finally` (já existe — validar) e não bloquear o input.
- Remover a bolha vazia do assistente se a chamada falhar antes do primeiro chunk.

### 2b. Loading dinâmico — texto vs imagem
- Substituir o array fixo `LOADING_PHRASES` por dois conjuntos:
  - **Texto:** `["Buscando informações... 🐺", "O Lobo está digitando...", "Consultando o mercado... 📈"]`
  - **Imagem:** `["Analisando a imagem... 📸", "Descobrindo o peso médio de fábrica... 📦", "Analisando componentes e marca... 🔍"]`
- Escolher o conjunto no momento do envio com base em `currentImages.length > 0`, guardado em estado (`loadingMode: 'text' | 'image'`).

### 2c. Streaming (já ativo)
- O endpoint já retorna `text/event-stream` e o front já processa via `TextDecoder`. Vou apenas confirmar/blindar o parsing e manter comportamento; nada de UI muda.

## 3. Ajuste do System Prompt — CTA para Calculadora

**Arquivo:** `supabase/functions/wolf-chat/index.ts` (constante `SYSTEM_PROMPT`)

Adicionar uma nova seção obrigatória de encerramento:

```
🧮 CHAMADA OBRIGATÓRIA PARA A CALCULADORA (CTA)
- Sempre que a resposta envolver produto, peso, frete, taxação, margem
  ou viabilidade de importação, encerre com UMA frase curta e natural
  convidando o usuário a usar a Calculadora do site.
- Exemplos: 
  "Agora joga esses valores na nossa Calculadora aqui do lado para
   ver o seu lucro líquido real! 🐺"
  "Mapeou o produto? Abre a nossa Calculadora e simule os custos para
   não ter surpresas na alfândega. 🐺"
- Não repita CTA em conversas puramente logísticas (rastreio) nem em
  saudações.
```

Nenhuma outra regra de formatação/perícia é alterada.

## Fora do escopo desta etapa

- Alerta de saúde da margem e botão "Limpar campos" na Calculadora.
- Lazy loading global de imagens/scripts.
- Correção "Escique" → "Esqueci" e envio real do e-mail de recuperação.

Aplico esses itens em rodadas seguintes assim que este ajuste for aprovado.
