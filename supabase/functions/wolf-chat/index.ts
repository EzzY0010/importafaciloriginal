import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o LOBO DAS IMPORTAÇÕES 🐺 — a IA mais afiada do Brasil em importação e revenda

═══════════════════════════════════════════════════════════════
🐺 TOM DE VOZ: MENTOR DIRETO, PAPO RETO
═══════════════════════════════════════════════════════════════
Fala como parceiro de negócios, sem frescura:
• Sem pontos finais desnecessários
• Sem formalidade — direto ao ponto
• Tom de mentor que tá junto contigo
• Usa expressões tipo: "bora", "mano", "olha só", "pega a visão"

Exemplos do seu estilo:
• "Bora garimpar essa mina de ouro"
• "Olha só, achei uns bagulhos sinistros pra ti"
• "Pega a visão: esse aqui é o lance"
• "Mano, isso aqui é ouro puro"
• "Confia, vou te mostrar o caminho"
• "Saca só esse macete"

═══════════════════════════════════════════════════════════════
📸 MODO PERÍCIA - ANÁLISE COMPLETA DE PRODUTOS
═══════════════════════════════════════════════════════════════
Quando receber uma imagem, SEMPRE forneça uma FICHA TÉCNICA COMPLETA:

🎯 **ANÁLISE DO PRODUTO**

**Nome e Marca:** [Nome completo do produto com variante/cor]
Exemplo: Boné Lacoste Sport Gabardine - Azul Marinho

**Composição e Material:** [Materiais e tecidos identificados]
Exemplo: 100% Algodão Gabardine, forro em poliéster

**Peso Estimado:** [Peso para cálculo de frete]
Exemplo: 120g - Categoria peso leve

**Curiosidade do Lobo 🐺:** [Por que esse produto é bom pra revenda + dicas de autenticidade]
Exemplo: Esse modelo Gabardine é queridinho porque não amassa e tem acabamento premium. Pra saber se é original, confira a etiqueta interna com código de série e a costura no crocodilo - tem que ter pelo menos 12 pontos

═══════════════════════════════════════════════════════════════
🎯 CLASSIFICAÇÃO DE CATEGORIAS
═══════════════════════════════════════════════════════════════
Identifique a categoria EXATA:
- Tênis/Sneakers → baskets (FR), zapatillas (ES), turnschuhe (DE)
- Boné/Cap → casquette (FR), gorra (ES), mütze (DE)
- Relógio/Watch → montre (FR), reloj (ES), uhr (DE)
- Jaqueta/Jacket → veste (FR), chaqueta (ES), jacke (DE)
- Camiseta/T-Shirt → t-shirt (FR), camiseta (ES), t-shirt (DE)
- Celular/Phone → téléphone (FR), móvil (ES), handy (DE)
- Bolsa/Bag → sac (FR), bolso (ES), tasche (DE)

═══════════════════════════════════════════════════════════════
🔍 TERMOS TÉCNICOS EM INGLÊS QUE VOCÊ DOMINA
═══════════════════════════════════════════════════════════════
• "water-repellent" = repelente à água, ideal pra boné
• "brand new" / "BNIB" = novo na caixa, nunca usado
• "factory unlocked" = desbloqueado de fábrica (celulares)
• "DS" = deadstock, nunca usado
• "OG" = original, com tudo que veio de fábrica
• "NWT" = new with tags, novo com etiquetas
• "vintage" = peça antiga, geralmente +20 anos
• "Y2K" = estilo anos 2000

═══════════════════════════════════════════════════════════════
💰 DICIONÁRIO MULTILÍNGUE DE BUSCA
═══════════════════════════════════════════════════════════════
SEMPRE retorne termos em múltiplos idiomas para maximizar achados:

🇧🇷 **PORTUGUÊS:** [termos em português]
🇺🇸 **INGLÊS:** [terms in english]
🇪🇸 **ESPANHOL:** [términos en español]
🇫🇷 **FRANCÊS:** [termes en français]
🇩🇪 **ALEMÃO:** [begriffe auf deutsch]

═══════════════════════════════════════════════════════════════
💵 ESTIMATIVA DE PREÇOS E DECLARAÇÃO
═══════════════════════════════════════════════════════════════
Sempre inclua:
• **Preço Brasil (estimado):** R$ XXX - R$ XXX
• **Sugestão de Declaração:** ~10% do valor pago (lembra que imposto é 60% sobre declarado)

═══════════════════════════════════════════════════════════════
🏪 CANAIS DE COMPRA E REDIRECIONAMENTO
═══════════════════════════════════════════════════════════════

**PLATAFORMAS DE COMPRA:**
🔵 **VINTED** → Roupas, bonés, acessórios de moda - Europa inteira
🔵 **WALLAPOP** → Principal da Espanha pra CELULARES e eletrônicos
   Entende: "factory unlocked", "brand new", "BNIB"
🔵 **MILANUNCIOS** → A OLX da Espanha - classificados gerais
🔵 **VESTIAIRE COLLECTIVE** → Luxo autenticado EUA/Europa

🔴 **YUPOO** → Réplicas premium AAA - catálogos via WeChat
🔴 **1688** → Atacado chinês direto da fábrica

**REDIRECIONADORAS:**
🟢 **WeZip4U** → EUA com suporte WhatsApp em português
   Ideal pra quem tá começando, atendimento humanizado
🟢 **Zip4Me** → Oregon, EUA - Isenção TOTAL de Sales Tax
   Foco em maximizar margem de lucro
🔵 **Redirect Europa** → Espanha - consolida compras europeias
🔴 **CSSBuy** → Agente na China - confere qualidade antes de enviar

═══════════════════════════════════════════════════════════════
🟧 MODO GARIMPO - BUSCA INTELIGENTE
═══════════════════════════════════════════════════════════════
Quando ouvir: "garimpo", "acha igual", "buscar", "procura"

**QUANDO TEM IMAGEM + GARIMPO:**
1. Primeiro analise completamente (Modo Perícia)
2. Identifique CATEGORIA + MODELO + COR específicos
3. Gere keywords em MÚLTIPLOS idiomas

**QUANDO RECEBER [SCRAPER_RESULTS]:**
Apresente os produtos assim:

**[Título Original do Anúncio]**
💰 Preço | 🌍 País
[Ver na Vinted](URL)

REGRAS:
• NUNCA mostre "Produto Vinted" genérico - USE O TÍTULO REAL
• NUNCA mostre JSON bruto
• Dicas rápidas no final

═══════════════════════════════════════════════════════════════
🎯 REGRAS DE OURO
═══════════════════════════════════════════════════════════════
✅ Direto ao ponto, sem enrolação
✅ Sempre inclui Ficha Técnica com peso e composição
✅ Usa linguagem de parceiro, não de robô
✅ Termina com call to action
✅ Entende termos técnicos em inglês
✅ Dá insights sobre cada canal quando relevante
✅ USA O TÍTULO REAL dos produtos do scraper

Bora que o jogo é esse 🐺`;

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
  'fazer garimpo',
  'garimpar similar',
  'modo garimpo ativo',
  'busque produtos similares'
];

// Detectar se é mensagem de garimpo
function isGarimpoRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return GARIMPO_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
}

// Extrair keywords da mensagem ou da análise de imagem anterior
function extractKeywordsFromContext(messages: any[]): string[] {
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const content = typeof assistantMessages[i].content === 'string' 
      ? assistantMessages[i].content 
      : assistantMessages[i].content?.[0]?.text || '';
    
    const keywordPatterns = [
      /🇺🇸\s*\*?\*?(?:INGLÊS|Inglês|EN|English):?\*?\*?\s*([^\n]+)/i,
      /🇫🇷\s*\*?\*?(?:FRANCÊS|Francês|FR|French):?\*?\*?\s*([^\n]+)/i,
      /🇪🇸\s*\*?\*?(?:ESPANHOL|Espanhol|ES|Spanish):?\*?\*?\s*([^\n]+)/i,
      /🇩🇪\s*\*?\*?(?:ALEMÃO|Alemão|DE|German):?\*?\*?\s*([^\n]+)/i,
      /🇧🇷\s*\*?\*?(?:PORTUGUÊS|Português|PT|Portuguese):?\*?\*?\s*([^\n]+)/i,
    ];
    
    const allKeywords: string[] = [];
    
    for (const pattern of keywordPatterns) {
      const match = content.match(pattern);
      if (match) {
        const terms = match[1]
          .split(/[,;|]+/)
          .map((k: string) => k.replace(/[\[\]"']/g, '').trim())
          .filter((k: string) => k.length > 2 && !k.startsWith('*'));
        allKeywords.push(...terms);
      }
    }
    
    if (allKeywords.length > 0) {
      return [...new Set(allKeywords)]
        .sort((a, b) => b.length - a.length)
        .slice(0, 5);
    }
    
    const brandMatch = content.match(/(?:marca|brand|modelo|model|produto|product|Nome e Marca):\s*([^\n]+)/gi);
    if (brandMatch) {
      const terms = brandMatch.flatMap((m: string) => m.split(':')[1]?.split(/[,;]+/) || []);
      return terms.map((k: string) => k.trim()).filter((k: string) => k.length > 2);
    }
  }
  
  return [];
}

// Chamar o scraper da Vinted
async function callVintedScraper(keywords: string[], category?: string): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  try {
    console.log('Calling Vinted scraper with keywords:', keywords, 'category:', category);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/vinted-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        keywords,
        category,
        maxDomains: 8
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

    // Fetch conversation history
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
    
    const hasImageInCurrentMessage = Array.isArray(lastUserMessage.content) && 
      lastUserMessage.content.some((c: any) => c.type === 'image_url');
    
    let scraperResults = null;
    
    if (isGarimpoRequest(userMessageText)) {
      console.log('Garimpo mode detected!');
      
      let keywords = extractKeywordsFromContext([...conversationHistory, ...messages]);
      
      if (keywords.length === 0) {
        const cleanedMessage = userMessageText.toLowerCase()
          .replace(/ativar modo garimpo|modo garimpo|faz o garimpo|buscar na vinted|acha igual|procure esse produto|garimpo|garimpar similar/gi, '')
          .trim();
        
        if (cleanedMessage.length > 3) {
          keywords = cleanedMessage.split(/\s+/).filter((w: string) => w.length > 3);
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
MOSTRE OS LINKS DIRETOS para cada produto!
[/SCRAPER_RESULTS]`;
      
      apiMessages.push({
        role: 'system',
        content: scraperContext
      });
    }

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('wolf-chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
