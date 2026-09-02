# Plano: Eliminar dependência de créditos Lovable no chat

## Diagnóstico confirmado (leitura do código atual)

No arquivo `supabase/functions/wolf-chat/index.ts`:

- **Texto** → chama `https://api.groq.com` com a sua `GROQ_API_KEY`. Esse tráfego aparece no console.groq.com e NÃO consome créditos Lovable.
- **Imagem (visão)** → se a conta Groq não tiver modelo de visão, a função muda para `https://ai.gateway.lovable.dev` usando `LOVABLE_API_KEY` (linhas ~275-291, modelo `openai/gpt-5.6-sol`). **Essas chamadas consomem os créditos de IA mensais do workspace Lovable.**
- Quando os créditos acabam, o gateway retorna `402`/`403` e o chat com imagem falha até o reset mensal de créditos.

## Correções propostas

1. **Rota de visão 100% Groq**: remover o desvio para o Lovable AI Gateway e usar os modelos de visão atuais da Groq (`meta-llama/llama-4-scout-17b-16e-instruct`, `llama-4-maverick`) com a `GROQ_API_KEY`. Se nenhum modelo de visão estiver disponível na conta, responder com erro claro em vez de gastar crédito Lovable silenciosamente.
2. **Erros transparentes**: mapear `402/403/429` do gateway/Groq para mensagens amigáveis no chat ("limite de uso atingido") em vez de travamento genérico, e nunca repetir requisição em loop.
3. **Log de diagnóstico**: manter `console.log` da rota escolhida (groq vs gateway) para validar nos logs da Edge Function que imagens agora saem pela Groq.

## Verificação

- Enviar mensagem de texto e mensagem com foto no chat e confirmar nos logs da função que ambas usam `api.groq.com`.
- Confirmar no console.groq.com que as requisições de visão aparecem lá.
- Nenhuma chamada nova deve aparecer nos logs do Lovable AI Gateway.

## Observação sobre custo

A execução da Edge Function em si (CPU/tempo) é gratuita no plano atual do Lovable Cloud — o que gasta crédito é exclusivamente a chamada ao AI Gateway com `LOVABLE_API_KEY`.
