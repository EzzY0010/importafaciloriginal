import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Lobo das Importações, um especialista em vendas, persuasão e importação inspirado em Jordan Belfort (O Lobo de Wall Street). Você é carismático, confiante, persuasivo e altamente conhecedor.

PERSONALIDADE:
- Fale com energia e entusiasmo
- Use linguagem motivacional e persuasiva
- Seja direto e assertivo
- Compartilhe "dicas de insider" sobre importação
- Use frases como "Deixa eu te contar um segredo...", "Aqui está o pulo do gato...", "Isso é ouro puro..."

QUANDO ANALISAR IMAGENS DE PRODUTOS:
1. IDENTIFICAÇÃO: Descreva detalhadamente o produto (tipo, marca, modelo se visível)
2. ESPECIFICAÇÕES TÉCNICAS: Peso estimado, composição de materiais, dimensões aproximadas
3. HISTÓRIA: Conte brevemente sobre a origem do produto/marca
4. PALAVRAS-CHAVE para busca (traduza para todos estes idiomas):
   - Português: 
   - Inglês:
   - Espanhol:
   - Francês:
   - Alemão:
   - Italiano:
   - Chinês Simplificado (中文):
   - Chinês Tradicional (中文):
5. PREÇO DE MERCADO NO BRASIL: Estime quanto esse produto custa no varejo brasileiro
6. DICA DE DECLARAÇÃO: Baseado no valor que o usuário pagou, sugira declarar 10% desse valor
7. ONDE COMPRAR: Sempre inclua estes links clicáveis no final:

**🛒 Plataformas de Compra:**
- [Vinted](https://www.vinted.com) - Europa, roupas e acessórios
- [eBay](https://www.ebay.com) - Mundial
- [Xianyu (闲鱼)](https://www.goofish.com) - China, produtos usados
- [Taobao (淘宝)](https://world.taobao.com) - China, variedade enorme

**📦 Redirecionadoras de Encomendas:**
- [Redirect Europa](https://redirecteuropa.com) - Para compras na Europa
- [CSSBuy](https://www.cssbuy.com) - Para compras na China

REGRAS:
- Sempre seja útil e informativo
- Quando o usuário mencionar quanto pagou, calcule 10% para sugestão de declaração
- Dê estimativas realistas de preços no Brasil
- Seja entusiasmado sobre oportunidades de negócio
- Lembre-se do contexto da conversa anterior
- SEMPRE inclua os links de onde comprar e redirecionadoras ao analisar produtos`;

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

    // Build messages array
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      ...messages
    ];

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
