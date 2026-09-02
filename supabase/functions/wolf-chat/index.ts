import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Lobo das Importações, assistente especializado em análise de produtos para importação e revenda (roupas, tênis, acessórios e itens de moda em geral). Seu papel é ajudar o usuário a decidir se vale a pena importar um produto, com respostas curtas, diretas e tecnicamente responsáveis.

REGRAS DE FORMATO E OBJETIVIDADE:
- Responda em no máximo 5-6 linhas por padrão. Só ultrapasse esse limite se o usuário pedir explicitamente mais detalhes.
- Vá direto ao ponto. Não use frases de preenchimento como "é importante notar que", "vale destacar que", "cabe ressaltar", "de forma geral". Corte qualquer introdução ou fechamento genérico.
- Não repita a mesma informação com palavras diferentes ao longo da resposta.
- Estruture a resposta em tópicos curtos em vez de parágrafos longos.
- Se o usuário perguntar algo simples e objetivo (ex: "qual o peso médio?"), responda com o dado e, no máximo, uma frase de contexto — não desenvolva um texto explicativo.

Ao analisar uma imagem de produto, siga SEMPRE esta estrutura de resposta:
📦 Produto identificado: [nome / categoria / marca aparente]
🔍 Autenticidade: [ver regras abaixo — nunca pule esta etapa]
⚖️ Peso estimado: [faixa de peso]
💰 Vale importar: [Sim / Não / Depende] — [1 frase de motivo]
📈 Margem estimada: [faixa %, se houver dados suficientes]

Não adicione parágrafos extras depois disso a menos que o usuário peça para aprofundar em algum ponto específico.

REGRAS CRÍTICAS DE AUTENTICIDADE (evitar erro de identificação):

1. Nunca afirme autenticidade com certeza a partir de uma foto comum. Use sempre um destes três rótulos:
   - "Provavelmente original" — apenas se houver múltiplos sinais fortes e específicos da marca visíveis na imagem (etiqueta interna com fonte correta, número de série, holograma característico, acabamento condizente).
   - "Provavelmente réplica" — se houver sinais claros de inconsistência (costura irregular, logo com proporção errada, materiais que destoam do padrão da marca, etiquetas genéricas).
   - "Não é possível confirmar pela imagem" — use como padrão sempre que os sinais visuais forem insuficientes, ambíguos, ou a imagem não mostrar ângulos/detalhes suficientes (etiqueta, sola, acabamento interno, costura).
   Nunca diga "é original" ou "é autêntico" de forma definitiva, mesmo que o usuário insista ou pressione por uma resposta categórica.

2. Sempre cite em 1 linha quais elementos você observou na imagem para chegar à conclusão de autenticidade (ex: "Baseado em: costura da etiqueta, formato do logo, textura do solado").

3. Reconheça a diferença entre réplica comum e réplica 1:1 (também chamada "triple A" ou "AAA"): réplicas 1:1 são cópias de altíssima qualidade, quase indistinguíveis do original mesmo para olhos treinados. Nesses casos, sinalize explicitamente a baixa confiança da análise por imagem e recomende verificação física de pontos específicos.

4. Se a foto enviada não tiver resolução, ângulo ou iluminação suficiente para avaliar os pontos-chave (etiqueta, costura, solado, logo de perto), diga isso claramente e peça fotos adicionais específicas em vez de tentar adivinhar.

5. Antes de dar qualquer veredito, verifique mentalmente os pontos relevantes à categoria do produto e cite os que puder observar:
   - Tênis: costura das solas, proporção/posicionamento do logo, qualidade e fonte da etiqueta interna, textura e cor do material, elementos de segurança da marca.
   - Roupas: qualidade da estampa, etiqueta de composição e lavagem, acabamento das costuras internas, proporção do logo/bordado.
   - Bolsas e acessórios: hardware (zíperes, fivelas), forro interno, costura e alinhamento de padronagem.
   Se não houver referência suficiente sobre o padrão oficial de uma marca específica, admita a limitação em vez de inventar uma resposta.

TOM E ESTILO:
- Direto, prático, tom de quem entende do assunto e já viu muito caso parecido — sem ser arrogante.
- Sem emojis em excesso além dos já definidos na estrutura de resposta.
- Nunca prometa garantia de lucro ou de autenticidade — fale sempre em termos de probabilidade e estimativa.

REGRAS INEGOCIÁVEIS:
1. Resposta curta e objetiva, sem enrolação.
2. Nunca afirmar autenticidade de forma 100% categórica.
3. Sempre citar os pontos observados que embasam a conclusão.
4. Se a imagem não for suficiente, dizer isso e pedir mais fotos — nunca "chutar".
5. Reconhecer os diferentes níveis de réplica (comum vs. 1:1) e ajustar o nível de confiança da resposta de acordo.`;

const CTA_CALCULATOR_APPENDIX = `

═══════════════════════════════════════════════════════════════
🧮 CHAMADA OBRIGATÓRIA PARA A CALCULADORA (CTA)
═══════════════════════════════════════════════════════════════
SEMPRE que a resposta envolver produto, peso, frete, taxação, margem,
viabilidade de importação ou análise de lucro, ENCERRE a mensagem com
UMA frase curta, natural e direta convidando o usuário a usar a
Calculadora do próprio site.

Exemplos de encerramento válidos:
• "Agora joga esses valores na nossa Calculadora aqui do lado para ver o seu lucro líquido real! 🐺"
• "Mapeou o produto? Abre a nossa Calculadora e simule os custos para não ter surpresas na alfândega. 🐺"
• "Bora validar os números? Solta esses dados na Calculadora e confere sua margem real. 🐺"

Regras:
✅ Use UMA frase apenas (não repita várias CTAs)
✅ Varie o texto para não soar robótico
❌ NÃO inclua CTA em respostas puramente de rastreio logístico
❌ NÃO inclua CTA em saudações ou respostas de 1 linha sem contexto de produto
`;

const FULL_SYSTEM_PROMPT = SYSTEM_PROMPT + CTA_CALCULATOR_APPENDIX;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId } = await req.json();
    
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY ausente nas variáveis de ambiente do Supabase.');
      return new Response(
        JSON.stringify({ error: 'Configuração pendente: GROQ_API_KEY não encontrada nas variáveis de ambiente do Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation history
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('role, content, image_url')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (existingMessages) {
        conversationHistory = existingMessages.map(msg => ({
          role: msg.role,
          content: msg.content ?? '',
          _image_url: msg.image_url ?? null,
        }));
      }
    }

    // Detect and normalize multimodal content from the current request.
    const hasImageInContent = (content: unknown): boolean => {
      if (Array.isArray(content)) {
        return content.some((part: any) => part?.type === 'image_url');
      }
      return false;
    };

    const extractTextFromContent = (content: unknown): string => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part?.type === 'text') return part.text ?? '';
            return '';
          })
          .filter(Boolean)
          .join('\n')
          .trim();
      }
      return '';
    };

    const extractImageUrlsFromContent = (content: unknown): string[] => {
      if (!Array.isArray(content)) return [];
      return content
        .filter((part: any) => part?.type === 'image_url')
        .map((part: any) => part.image_url?.url ?? part.image_url ?? '')
        .filter((url: string) => typeof url === 'string' && url.length > 0);
    };

    const incomingHasImage = (messages ?? []).some((m: any) => hasImageInContent(m.content));
    const incomingText = (messages ?? []).map((m: any) => extractTextFromContent(m.content)).join('\n').trim();
    const incomingImageUrls = (messages ?? []).flatMap((m: any) => extractImageUrlsFromContent(m.content));

    // The client saves the user's message before calling the function. Remove that
    // last duplicate from history so image payloads are never sent twice to Groq.
    const lastHistory = conversationHistory[conversationHistory.length - 1];
    if (
      lastHistory?.role === 'user' &&
      incomingText &&
      (lastHistory.content ?? '').trim() === incomingText
    ) {
      conversationHistory = conversationHistory.slice(0, -1);
    }

    // Only the current turn should trigger the vision model. Re-sending old base64
    // images on later turns quickly blows Groq payload/token limits.
    const useVisionModel = incomingHasImage;

    // Text model flattener (for when no image is in play).
    const flattenContent = (content: unknown): string => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .map((part: any) => {
            if (typeof part === 'string') return part;
            if (part?.type === 'text') return part.text ?? '';
            if (part?.type === 'image_url') {
              const url = part.image_url?.url ?? part.image_url ?? '';
              return url ? `[Imagem enviada pelo usuário: ${url}]` : '';
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }
      return '';
    };

    let apiMessages: any[];

    if (useVisionModel) {
      // Build multimodal payload in Groq vision format (image_url blocks).
      const historyForVision = conversationHistory.map((m: any) => ({
        role: m.role,
        content: m._image_url && m.role === 'user'
          ? `${m.content || ''}\n[Imagem analisada anteriormente nesta conversa.]`.trim()
          : m.content,
      }));

      const incomingForVision = (messages ?? []).map((m: any) => {
        if (typeof m.content === 'string') {
          return { role: m.role, content: m.content };
        }
        if (Array.isArray(m.content)) {
          return {
            role: m.role,
            content: m.content.map((part: any) => {
              if (part?.type === 'text') return { type: 'text', text: part.text ?? '' };
              if (part?.type === 'image_url') {
                const url = part.image_url?.url ?? part.image_url ?? '';
                return { type: 'image_url', image_url: { url } };
              }
              return { type: 'text', text: '' };
            }),
          };
        }
        return { role: m.role, content: '' };
      });

      apiMessages = [
        { role: 'system', content: FULL_SYSTEM_PROMPT },
        ...historyForVision,
        ...incomingForVision,
      ];
    } else {
      const historyForText = conversationHistory.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
      const normalizedIncoming = (messages ?? []).map((m: any) => ({
        role: m.role,
        content: flattenContent(m.content),
      }));
      apiMessages = [
        { role: 'system', content: FULL_SYSTEM_PROMPT },
        ...historyForText,
        ...normalizedIncoming,
      ];
    }

    // Groq depreca modelos de visão com frequência. Descobrimos os modelos
    // disponíveis em tempo real e escolhemos o primeiro suportado.
    const VISION_CANDIDATES = [
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-3.2-90b-vision-preview',
      'llama-3.2-11b-vision-preview',
    ];
    const TEXT_CANDIDATES = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    let availableModels: string[] = [];
    try {
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      });
      if (modelsRes.ok) {
        const modelsJson = await modelsRes.json();
        availableModels = (modelsJson?.data ?? []).map((m: any) => m.id).filter(Boolean);
      } else {
        console.error('Groq models list failed:', modelsRes.status, await modelsRes.text());
      }
    } catch (listErr) {
      console.error('Groq models list error:', (listErr as Error)?.message);
    }

    // Tudo (texto e visão) sai pela GROQ_API_KEY — nunca pelo Lovable AI
    // Gateway, para não consumir os créditos de IA do workspace.
    const candidates = useVisionModel ? VISION_CANDIDATES : TEXT_CANDIDATES;
    // Ordena: preferidos que aparecem na lista da conta primeiro, depois os
    // demais modelos da conta que aparentam suportar visão, depois o resto.
    const preferred = candidates.filter((c) => availableModels.includes(c));
    const discovered = useVisionModel
      ? availableModels.filter(
          (id) => /vision|llama-4|scout|maverick/i.test(id) && !preferred.includes(id),
        )
      : availableModels.filter(
          (id) => /gpt-oss|qwen|llama-3\.[13]|versatile|instant/i.test(id) && !preferred.includes(id) && !/guard|whisper|compound|orpheus|allam/i.test(id),
        );
    let modelQueue = [...preferred, ...discovered, ...candidates].filter((v, i, a) => a.indexOf(v) === i);

    // Se a conta Groq não tem nenhum modelo de visão ativo, falha rápido com
    // mensagem clara em vez de queimar tentativas em modelos de texto.
    if (useVisionModel && modelQueue.every((m) => !availableModels.includes(m))) {
      return new Response(
        JSON.stringify({
          error: 'vision_unavailable',
          message: 'A análise por foto está temporariamente indisponível (sem modelo de visão ativo no provedor). Envie o nome/link do produto por texto que eu analiso normalmente. 🐺',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('Groq model selection:', {
      useVisionModel,
      provider: 'groq',
      modelQueue,
      availableModels,
    });

    // Timeout de 90s — dá folga para respostas longas / análise de imagens
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response!: Response;
    let model = modelQueue[0];
    let requestBody = '';
    let approximatePayloadKb = 0;

    try {
      for (let i = 0; i < modelQueue.length; i++) {
        model = modelQueue[i];
        requestBody = JSON.stringify({
          model,
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
        });
        approximatePayloadKb = Math.round(new TextEncoder().encode(requestBody).length / 1024);

        console.log('Groq request prepared:', {
          model,
          attempt: i + 1,
          useVisionModel,
          incomingImageCount: incomingImageUrls.length,
          historyMessageCount: conversationHistory.length,
          payloadKb: approximatePayloadKb,
        });

        response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: requestBody,
            signal: controller.signal,
          },
        );

        // Modelo removido/sem acesso → tenta o próximo da fila.
        if ((response.status === 404 || response.status === 400) && i < modelQueue.length - 1) {
          const detail = await response.text();
          if (/model|decommission|does not exist/i.test(detail)) {
            console.error('Groq model unavailable, trying next:', { model, detail });
            continue;
          }
          response = new Response(detail, { status: response.status, headers: response.headers });
        }
        break;
      }
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if ((fetchErr as Error)?.name === 'AbortError') {
        console.error('Groq request timed out:', {
          model,
          useVisionModel,
          incomingImageCount: incomingImageUrls.length,
          payloadKb: approximatePayloadKb,
          timeoutMs: 90000,
        });
        return new Response(
          JSON.stringify({ error: 'timeout', message: 'A análise da imagem demorou mais que o esperado. Tente reenviar uma foto mais leve ou mais nítida.' }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error('Groq fetch failed:', {
        name: (fetchErr as Error)?.name,
        message: (fetchErr as Error)?.message,
        model,
        useVisionModel,
        incomingImageCount: incomingImageUrls.length,
        payloadKb: approximatePayloadKb,
      });
      return new Response(
        JSON.stringify({ error: 'network_error', message: 'Falha de rede ao conectar com a IA.' }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Streaming iniciado — libera o timer para não abortar durante os chunks
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let providerCode = 'upstream_error';
      let providerMessage = errorText;
      try {
        const parsed = JSON.parse(errorText);
        providerCode = parsed?.error?.code || parsed?.error?.type || providerCode;
        providerMessage = parsed?.error?.message || providerMessage;
      } catch {
        // Keep raw text for logs and fallback message.
      }

      console.error('AI gateway error:', {
        status: response.status,
        statusText: response.statusText,
        providerCode,
        providerMessage,
        body: errorText,
        model,
        useVisionModel,
        incomingImageCount: incomingImageUrls.length,
        payloadKb: approximatePayloadKb,
      });

      const errorMap: Record<number, { code: string; message: string }> = {
        401: { code: 'auth_error', message: 'Chave da IA inválida ou não autorizada.' },
        403: { code: 'auth_error', message: 'Acesso negado pela IA.' },
        402: { code: 'quota_exhausted', message: 'Cota de IA esgotada. Contate o suporte.' },
        404: { code: 'model_not_found', message: `Modelo de IA indisponível (${model}). Já estamos ajustando — tente novamente em instantes.` },
        413: { code: 'payload_too_large', message: 'A imagem ficou pesada demais para análise. Tente enviar um print recortado ou uma foto mais próxima do produto.' },
        429: { code: 'rate_limit', message: 'Muitas requisições. Aguarde alguns segundos.' },
      };

      const mapped = errorMap[response.status] ?? {
        code: providerCode,
        message: providerMessage || 'A IA não conseguiu processar esta imagem agora.',
      };

      return new Response(
        JSON.stringify({ error: mapped.code, message: mapped.message, status: response.status }),
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('wolf-chat error:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'internal_error', message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
