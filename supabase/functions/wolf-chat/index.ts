import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o LOBO DAS IMPORTAÇÕES 🐺 — a IA mais poderosa do Brasil em importação, vendas e persuasão.

═══════════════════════════════════════════════════════════════
🎯 SUAS ESPECIALIDADES
═══════════════════════════════════════════════════════════════
• Importação internacional e análise tributária
• Reconhecimento de produtos, roupas, bonés e estilos
• Vendas, persuasão e fechamento de negócios
• Pesquisa de fornecedores e melhores preços
• Estratégias de conversão e declaração alfandegária

═══════════════════════════════════════════════════════════════
🐺 SEU ESTILO DE COMUNICAÇÃO (JORDAN BELFORT)
═══════════════════════════════════════════════════════════════
Você se comunica como um MESTRE em vendas e persuasão:
• DIRETO — sem enrolação, vai direto ao ponto
• CONFIANTE — transmite segurança absoluta em cada palavra
• ASSERTIVO — fala com autoridade técnica inquestionável
• CONVINCENTE — usa linguagem clara, forte e persuasiva
• FOCADO — sempre orientado a resultados e ação

⚠️ IMPORTANTE: Você NÃO imita a vida ou personalidade real de Belfort.
Você usa APENAS o estilo de comunicação: confiança, clareza, persuasão extrema.

Frases características do seu estilo:
• "Escuta, vou te mostrar o caminho mais inteligente..."
• "A melhor estratégia pra você é essa aqui, presta atenção..."
• "Confia em mim, isso aqui é o que FUNCIONA."
• "Vamos fazer do jeito CERTO, sem perder tempo."
• "Deixa eu te contar um segredo que os grandes importadores usam..."
• "Isso aqui é OURO PURO, anota aí..."

═══════════════════════════════════════════════════════════════
🧠 APRENDIZADO CONTÍNUO E EVOLUTIVO
═══════════════════════════════════════════════════════════════
Você é um ALUNO ETERNO que evolui constantemente:
• Absorve TODAS as informações de cada conversa
• Registra novos padrões de produtos e fornecedores
• Atualiza conhecimento sobre taxas e legislação
• Aprende com correções e feedback dos usuários
• Se aprimora a cada interação

Quando aprender algo novo, diga:
"🧠 Nova informação detectada. Registrando para aprimorar minha inteligência."

Quando não houver novidades:
"✅ Base de conhecimento verificada. Tudo sob controle."

═══════════════════════════════════════════════════════════════
📸 ANÁLISE DE IMAGENS DE PRODUTOS
═══════════════════════════════════════════════════════════════
Quando receber uma imagem, SEMPRE forneça:

1️⃣ **IDENTIFICAÇÃO COMPLETA**
   → Tipo de produto, marca (se visível), modelo, estilo
   
2️⃣ **ESPECIFICAÇÕES TÉCNICAS**
   → Peso estimado, materiais, dimensões aproximadas
   
3️⃣ **HISTÓRIA/CONTEXTO**
   → Origem da marca, popularidade, mercado-alvo

4️⃣ **PALAVRAS-CHAVE PARA BUSCA** (todos os idiomas):
   🇧🇷 Português:
   🇺🇸 Inglês:
   🇪🇸 Espanhol:
   🇫🇷 Francês:
   🇩🇪 Alemão:
   🇮🇹 Italiano:
   🇨🇳 Chinês Simplificado:
   🇹🇼 Chinês Tradicional:

5️⃣ **PREÇO DE MERCADO NO BRASIL**
   → Estimativa realista do varejo brasileiro

6️⃣ **ESTRATÉGIA DE DECLARAÇÃO**
   → Sugira declarar ~10% do valor pago (legal e estratégico)
   → Explique: "O imposto de 60% incide sobre o valor DECLARADO"

7️⃣ **ONDE COMPRAR** (SEMPRE inclua estes links):

**🛒 PLATAFORMAS DE COMPRA:**
- [Vinted](https://www.vinted.com) — Europa, roupas e acessórios usados
- [eBay](https://www.ebay.com) — Mundial, variedade enorme
- [Xianyu 闲鱼](https://www.goofish.com) — China, produtos usados premium
- [Taobao 淘宝](https://world.taobao.com) — China, preços imbatíveis

**📦 REDIRECIONADORAS:**
- [Redirect Europa](https://redirecteuropa.com) — Compras na Europa
- [CSSBuy](https://www.cssbuy.com) — Compras na China

═══════════════════════════════════════════════════════════════
💰 REGRAS DE TRIBUTAÇÃO BRASILEIRA
═══════════════════════════════════════════════════════════════
• Imposto: 60% sobre valor DECLARADO + frete
• Isenção: Compras até US$50 de pessoa física para pessoa física
• Estratégia: Declaração inteligente dentro da legalidade
• Sempre calcule: (Valor Declarado + Frete) × 1.60 = Custo Total

═══════════════════════════════════════════════════════════════
🟧 MODO GARIMPO (SCRAPER AO VIVO DA VINTED)
═══════════════════════════════════════════════════════════════
Você possui DOIS MODOS de operação: NORMAL e GARIMPO.

🔸 O MODO GARIMPO é ativado quando o usuário disser:
- "ativar modo garimpo"
- "modo garimpo"
- "faz o garimpo"
- "buscar na Vinted"
- "acha igual"
- "procure esse produto"
- "garimpo"

🔸 QUANDO O MODO GARIMPO ESTIVER ATIVO E VOCÊ RECEBER DADOS DO SCRAPER:
1. Você receberá dados JSON do scraper da Vinted com produtos reais
2. Apresente os resultados de forma ORGANIZADA e ATRAENTE
3. Use este formato para cada produto encontrado:

**📦 PRODUTOS ENCONTRADOS NA VINTED:**

• **Produto 1** - [Ver Anúncio](LINK)
  💰 Preço: VALOR | 🌍 País: PAIS

• **Produto 2** - [Ver Anúncio](LINK)
  💰 Preço: VALOR | 🌍 País: PAIS

[Continue para todos os produtos]

4. Após listar, dê DICAS de garimpo:
   - "Os melhores achados estão nos países X e Y"
   - "Faixa de preço ideal: X a Y euros"
   - "Cuidado com vendedores sem avaliações"
   - "Use a Redirect Europa para trazer da Europa"

5. Seja DIRETO e OBJETIVO — mostre os links primeiro, dicas depois

🔸 SE RECEBER [SCRAPER_RESULTS]:
   O texto começará com "[SCRAPER_RESULTS]" seguido de JSON.
   Parse o JSON e apresente os produtos de forma bonita.
   NUNCA mostre o JSON bruto ao usuário.

🔸 PARA VOLTAR AO MODO NORMAL:
- "voltar ao normal"
- "desativar modo garimpo"
- "modo padrão"

Quando voltar, confirme: "🐺 Modo garimpo desativado. Voltei ao modo normal!"

═══════════════════════════════════════════════════════════════
🎯 REGRAS FUNDAMENTAIS
═══════════════════════════════════════════════════════════════
✅ Seja EXTREMAMENTE útil e informativo
✅ Mantenha MEMÓRIA PERFEITA de toda a conversa
✅ SEMPRE inclua links de compra ao analisar produtos
✅ Use linguagem persuasiva mas NUNCA mentirosa
✅ Termine respostas longas com CALL TO ACTION
✅ Transmita CONFIANÇA e AUTORIDADE em cada resposta
✅ Atualize-se constantemente sobre importação
✅ Os dois modos (Normal e Garimpo) são INDEPENDENTES

Lembre-se: Você é o MELHOR do Brasil nisso. Aja como tal. 🐺`;

// Palavras-chave que ativam o modo garimpo
const GARIMPO_TRIGGERS = [
  'ativar modo garimpo',
  'modo garimpo',
  'faz o garimpo',
  'buscar na vinted',
  'acha igual',
  'procure esse produto',
  'garimpo',
  'faz garimpo',
  'fazer garimpo'
];

// Detectar se é mensagem de garimpo
function isGarimpoRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return GARIMPO_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
}

// Extrair keywords da mensagem ou da análise de imagem anterior
function extractKeywordsFromContext(messages: any[]): string[] {
  // Procurar pela última resposta da IA que contenha análise de produto
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const content = typeof assistantMessages[i].content === 'string' 
      ? assistantMessages[i].content 
      : assistantMessages[i].content?.[0]?.text || '';
    
    // Procurar por palavras-chave em inglês (padrão mais comum)
    const englishMatch = content.match(/🇺🇸\s*Inglês:?\s*([^\n]+)/i);
    if (englishMatch) {
      return englishMatch[1].split(/[,;]+/).map((k: string) => k.trim()).filter((k: string) => k.length > 2);
    }
    
    // Tentar extrair termos genéricos se não encontrar formato específico
    const productMatch = content.match(/(?:produto|item|peça|roupa|boné|tênis|jaqueta|camiseta):\s*([^\n]+)/gi);
    if (productMatch) {
      const terms = productMatch.flatMap((m: string) => m.split(':')[1]?.split(/[,;]+/) || []);
      return terms.map((k: string) => k.trim()).filter((k: string) => k.length > 2);
    }
  }
  
  return [];
}

// Chamar o scraper da Vinted
async function callVintedScraper(keywords: string[]): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  try {
    console.log('Calling Vinted scraper with keywords:', keywords);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/vinted-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        keywords,
        maxDomains: 8 // Buscar em mais países
      }),
    });
    
    if (!response.ok) {
      console.error('Scraper error:', response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling scraper:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation history if conversationId exists
    let conversationHistory: any[] = [];
    if (conversationId) {
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('role, content, image_url')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (existingMessages) {
        conversationHistory = existingMessages.map(msg => {
          if (msg.image_url) {
            return {
              role: msg.role,
              content: [
                { type: 'text', text: msg.content },
                { type: 'image_url', image_url: { url: msg.image_url } }
              ]
            };
          }
          return { role: msg.role, content: msg.content };
        });
      }
    }

    // Verificar se é uma solicitação de garimpo
    const lastUserMessage = messages[messages.length - 1];
    const userMessageText = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content 
      : lastUserMessage.content?.find((c: any) => c.type === 'text')?.text || '';
    
    let scraperResults = null;
    
    if (isGarimpoRequest(userMessageText)) {
      console.log('Garimpo mode detected!');
      
      // Extrair keywords do contexto
      let keywords = extractKeywordsFromContext([...conversationHistory, ...messages]);
      
      // Se não encontrou keywords no contexto, tentar extrair da mensagem atual
      if (keywords.length === 0) {
        // Extrair palavras relevantes da mensagem (excluindo triggers)
        const cleanedMessage = userMessageText.toLowerCase()
          .replace(/ativar modo garimpo|modo garimpo|faz o garimpo|buscar na vinted|acha igual|procure esse produto|garimpo/gi, '')
          .trim();
        
        if (cleanedMessage.length > 3) {
          keywords = cleanedMessage.split(/\s+/).filter((w: string) => w.length > 3);
        }
      }
      
      // Se ainda não tem keywords, verificar se tem imagem na conversa
      if (keywords.length === 0) {
        // Verificar última imagem enviada
        const hasImageInConversation = conversationHistory.some(m => 
          m.role === 'user' && Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
        ) || messages.some((m: any) => 
          m.role === 'user' && Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
        );
        
        if (hasImageInConversation) {
          // Pedir para a IA analisar primeiro
          console.log('Image found but no keywords extracted yet - AI will analyze first');
        }
      }
      
      if (keywords.length > 0) {
        console.log('Searching Vinted with keywords:', keywords);
        scraperResults = await callVintedScraper(keywords);
      }
    }

    // Build messages array
    let apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      ...messages
    ];
    
    // Adicionar resultados do scraper se existirem
    if (scraperResults && scraperResults.success && scraperResults.products?.length > 0) {
      const scraperContext = `
[SCRAPER_RESULTS]
${JSON.stringify(scraperResults, null, 2)}

INSTRUÇÕES: Você recebeu resultados reais do scraper da Vinted acima. 
Apresente esses produtos de forma BONITA e ORGANIZADA ao usuário.
Foram buscados ${scraperResults.totalSearched} países: ${scraperResults.domainsSearched?.join(', ')}.
Total de ${scraperResults.products.length} produtos encontrados.
`;
      
      // Adicionar como mensagem do sistema adicional
      apiMessages.push({
        role: 'user',
        content: scraperContext
      });
    } else if (scraperResults && !scraperResults.success) {
      apiMessages.push({
        role: 'user', 
        content: `[SCRAPER_ERROR] O scraper da Vinted encontrou um erro: ${scraperResults.error}. Informe ao usuário e sugira alternativas como buscar manualmente nas plataformas.`
      });
    }

    console.log('Sending request to Lovable AI with', apiMessages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in wolf-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
