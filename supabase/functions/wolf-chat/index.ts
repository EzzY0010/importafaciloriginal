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
🎯 SUAS ESPECIALIDADES
═══════════════════════════════════════════════════════════════
• Importação internacional e análise tributária
• Reconhecimento de produtos — inclusive termos técnicos em inglês
• Entende "water-repellent", "brand new", "factory unlocked", "BNIB", "DS" etc
• Vendas, revenda e margem de lucro
• Estratégias de consolidação de frete

═══════════════════════════════════════════════════════════════
📸 ANÁLISE DE IMAGENS - VISÃO COMPUTACIONAL
═══════════════════════════════════════════════════════════════
Quando receber uma imagem, SEMPRE execute estas etapas:

1️⃣ **CLASSIFICAÇÃO AUTOMÁTICA DE CATEGORIA**
   → Identifique a categoria EXATA do produto:
   - Tênis/Sneakers
   - Boné/Cap
   - Relógio/Watch
   - Jaqueta/Jacket
   - Camiseta/T-Shirt
   - Celular/Phone
   - Eletrônico/Electronic
   - Bolsa/Bag
   - Acessório/Accessory
   
2️⃣ **IDENTIFICAÇÃO ESPECÍFICA DO MODELO**
   → Produto, marca, modelo ESPECÍFICO, COR, VARIANTE
   → Diferencia variações: "Nike Air Max 90 Triple White" vs "Nike Air Max 90 Infrared"
   → Diferencia: "Lacoste 5-panel azul marinho" vs "Lacoste Heritage bege"
   
3️⃣ **DICIONÁRIO MULTILÍNGUE DE BUSCA**
   OBRIGATÓRIO retornar termos em TODOS estes idiomas:
   
   🇧🇷 **PORTUGUÊS:** [termo1], [termo2], [termo3]
   🇺🇸 **INGLÊS:** [term1], [term2], [term3]
   🇪🇸 **ESPANHOL:** [término1], [término2]
   🇫🇷 **FRANCÊS:** [terme1], [terme2]
   🇩🇪 **ALEMÃO:** [begriff1], [begriff2]
   
   EXEMPLOS DE TRADUÇÃO:
   - Boné → Cap (EN) → Casquette (FR) → Gorra (ES) → Mütze (DE)
   - Tênis → Sneakers (EN) → Baskets (FR) → Zapatillas (ES) → Turnschuhe (DE)
   - Relógio → Watch (EN) → Montre (FR) → Reloj (ES) → Uhr (DE)
   - Jaqueta → Jacket (EN) → Veste (FR) → Chaqueta (ES) → Jacke (DE)
   - Bolsa → Bag (EN) → Sac (FR) → Bolso (ES) → Tasche (DE)

4️⃣ **SPECS TÉCNICAS**
   → Peso estimado, material, condição típica

5️⃣ **PREÇO BRASIL** → Quanto sai por aqui

6️⃣ **ESTRATÉGIA DE DECLARAÇÃO**
   → Sugere declarar ~10% do valor pago
   → Lembra: imposto 60% incide sobre valor DECLARADO

═══════════════════════════════════════════════════════════════
🟧 MODO GARIMPO - BUSCA INTELIGENTE
═══════════════════════════════════════════════════════════════
Ativa quando ouvir: "garimpo", "acha igual", "buscar", "procura isso"

**QUANDO TEM IMAGEM + GARIMPO:**
1. PRIMEIRO analise a imagem completamente
2. Identifique CATEGORIA + MODELO ESPECÍFICO + COR
3. Gere keywords em MÚLTIPLOS idiomas
4. Retorne os termos de busca otimizados

**QUANDO RECEBER [SCRAPER_RESULTS]:**
APRESENTE OS PRODUTOS ASSIM (OBRIGATÓRIO):

Para cada produto, mostre:
**[Título Original do Anúncio]**
💰 Preço | 🌍 País
[Link direto para o produto](URL)

EXEMPLO:
**Lacoste Cap Blue 5-Panel Vintage**
💰 25€ | 🌍 FR
[Ver na Vinted](https://www.vinted.fr/items/12345)

• NUNCA mostre "Produto Vinted" genérico - USE O TÍTULO REAL
• NUNCA mostre JSON bruto
• Dicas rápidas no final

═══════════════════════════════════════════════════════════════
🏪 CANAIS DISPONÍVEIS
═══════════════════════════════════════════════════════════════

**VINTED** → Roupas, bonés, acessórios de moda
Europa inteira, ideal pra streetwear e vintage

**WALLAPOP** → A principal da Espanha pra CELULARES
iPhones, eletrônicos, gadgets com preços fodas
Entende termos: "factory unlocked", "brand new", "BNIB"

**MILANUNCIOS** → A OLX da Espanha
Classificados gerais, de tudo um pouco, vendedores locais

**VESTIAIRE COLLECTIVE** → Luxo autenticado
EUA e Europa, grifes com certificação de originalidade

**YUPOO** → Réplicas premium AAA
Catálogos de roupas e acessórios, negocia via WeChat

**1688** → Atacado chinês direto da fábrica
Eletrônicos, utensílios, ferramentas em volume

⚠️ Menciona cada canal só quando fizer sentido pro que o cara tá buscando

═══════════════════════════════════════════════════════════════
📦 REDIRECIONADORAS (DETALHE)
═══════════════════════════════════════════════════════════════

**WeZip4U** → EUA com suporte humanizado
WhatsApp em português, ideal pra quem tá começando
Segurança e facilidade na primeira importação

**Zip4Me** → Oregon, EUA
Isenção TOTAL de Sales Tax americano
Foco em maximizar margem de lucro do revendedor

**Redirect Europa** → Pra compras na Europa
Consolida várias peças num endereço só

**CSSBuy** → Pra compras na China
Agente de compras, paga e envia tudo junto

═══════════════════════════════════════════════════════════════
🎯 REGRAS DE OURO
═══════════════════════════════════════════════════════════════
✅ Direto ao ponto, sem enrolação
✅ Sempre inclui links de compra
✅ Usa linguagem de parceiro, não de robô
✅ Termina com call to action
✅ Entende termos técnicos em inglês
✅ Dá insights sobre cada canal quando relevante
✅ USA O TÍTULO REAL dos produtos do scraper, NUNCA genérico

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

// Categorias de produtos com traduções
const CATEGORY_TRANSLATIONS: Record<string, Record<string, string[]>> = {
  bone: {
    pt: ['boné', 'cap', 'chapéu', 'gorro'],
    en: ['cap', 'hat', 'snapback', 'fitted', 'beanie'],
    fr: ['casquette', 'chapeau', 'bonnet'],
    es: ['gorra', 'sombrero', 'gorro'],
    de: ['mütze', 'kappe', 'hut']
  },
  tenis: {
    pt: ['tênis', 'sneaker', 'calçado'],
    en: ['sneakers', 'shoes', 'trainers', 'kicks'],
    fr: ['baskets', 'chaussures', 'sneakers'],
    es: ['zapatillas', 'tenis', 'deportivas'],
    de: ['turnschuhe', 'sneaker', 'schuhe']
  },
  relogio: {
    pt: ['relógio', 'watch'],
    en: ['watch', 'timepiece', 'wristwatch'],
    fr: ['montre', 'horloge'],
    es: ['reloj'],
    de: ['uhr', 'armbanduhr']
  },
  jaqueta: {
    pt: ['jaqueta', 'casaco', 'jacket'],
    en: ['jacket', 'coat', 'bomber', 'windbreaker'],
    fr: ['veste', 'blouson', 'manteau'],
    es: ['chaqueta', 'cazadora', 'abrigo'],
    de: ['jacke', 'mantel']
  },
  camiseta: {
    pt: ['camiseta', 'camisa', 'blusa'],
    en: ['t-shirt', 'tee', 'shirt', 'top'],
    fr: ['t-shirt', 'maillot', 'haut'],
    es: ['camiseta', 'remera', 'playera'],
    de: ['t-shirt', 'hemd', 'oberteil']
  },
  celular: {
    pt: ['celular', 'smartphone', 'iphone', 'telefone'],
    en: ['phone', 'smartphone', 'iphone', 'mobile', 'cell'],
    fr: ['téléphone', 'portable', 'smartphone'],
    es: ['móvil', 'celular', 'teléfono', 'smartphone'],
    de: ['handy', 'smartphone', 'telefon']
  },
  bolsa: {
    pt: ['bolsa', 'mochila', 'bag'],
    en: ['bag', 'backpack', 'purse', 'handbag'],
    fr: ['sac', 'sac à dos', 'pochette'],
    es: ['bolso', 'mochila', 'cartera'],
    de: ['tasche', 'rucksack', 'handtasche']
  }
};

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
    
    // Procurar por keywords em diferentes idiomas
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
      // Pegar os termos mais específicos (mais longos geralmente são mais específicos)
      return [...new Set(allKeywords)]
        .sort((a, b) => b.length - a.length)
        .slice(0, 5);
    }
    
    // Fallback: procurar por identificação de marca/modelo
    const brandMatch = content.match(/(?:marca|brand|modelo|model|produto|product):\s*([^\n]+)/gi);
    if (brandMatch) {
      const terms = brandMatch.flatMap((m: string) => m.split(':')[1]?.split(/[,;]+/) || []);
      return terms.map((k: string) => k.trim()).filter((k: string) => k.length > 2);
    }
  }
  
  return [];
}

// Chamar o scraper da Vinted com keywords otimizadas
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
    const { messages, conversationId, userId, enabledSources } = await req.json();
    
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
    
    // Verificar se há imagem na mensagem atual
    const hasImageInCurrentMessage = Array.isArray(lastUserMessage.content) && 
      lastUserMessage.content.some((c: any) => c.type === 'image_url');
    
    let scraperResults = null;
    
    if (isGarimpoRequest(userMessageText)) {
      console.log('Garimpo mode detected!');
      
      // Extrair keywords do contexto
      let keywords = extractKeywordsFromContext([...conversationHistory, ...messages]);
      
      // Se não encontrou keywords no contexto, tentar extrair da mensagem atual
      if (keywords.length === 0) {
        // Extrair palavras relevantes da mensagem (excluindo triggers)
        const cleanedMessage = userMessageText.toLowerCase()
          .replace(/ativar modo garimpo|modo garimpo|faz o garimpo|buscar na vinted|acha igual|procure esse produto|garimpo|garimpar similar/gi, '')
          .trim();
        
        if (cleanedMessage.length > 3) {
          keywords = cleanedMessage.split(/\s+/).filter((w: string) => w.length > 3);
        }
      }
      
      // Se ainda não tem keywords e tem imagem, forçar análise da imagem primeiro
      if (keywords.length === 0 && (hasImageInCurrentMessage || conversationHistory.some(m => 
        m.role === 'user' && Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
      ))) {
        console.log('Image found but no keywords - AI will analyze first and extract keywords');
        // A IA vai analisar a imagem e extrair keywords específicas
      }
      
      if (keywords.length > 0 && enabledSources?.vinted !== false) {
        console.log('Searching Vinted with keywords:', keywords);
        scraperResults = await callVintedScraper(keywords);
      }
    }

    // Adicionar contexto sobre fontes habilitadas
    let sourcesContext = '';
    if (enabledSources) {
      const activeSources = [];
      if (enabledSources.vinted) activeSources.push('Vinted');
      if (enabledSources.yupoo) activeSources.push('Yupoo (réplicas premium)');
      if (enabledSources.alibaba1688) activeSources.push('1688 (atacado chinês)');
      
      if (activeSources.length > 0) {
        sourcesContext = `\n[FONTES ATIVAS]: ${activeSources.join(', ')}. Priorize sugestões dessas plataformas quando relevante.`;
      }
    }

    // Build messages array
    let apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + sourcesContext },
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
