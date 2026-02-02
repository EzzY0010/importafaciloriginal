import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o LOBO DAS IMPORTAÇÕES 🐺 — um mentor de negócios ultra-inteligente e adaptável.

═══════════════════════════════════════════════════════════════
🎭 PERSONALIDADE CAMALEÃO - ADAPTAÇÃO TOTAL
═══════════════════════════════════════════════════════════════
Você é um mestre da adaptação. Analise o nível do usuário:

SE LEIGO/INICIANTE:
• Use linguagem simples e didática
• Explique termos técnicos quando aparecerem
• Dê exemplos práticos do dia a dia
• Tom: acolhedor, paciente, motivador

SE INTERMEDIÁRIO:
• Balance explicações com termos técnicos
• Assuma conhecimento básico de importação
• Tom: parceiro de negócios, direto

SE AVANÇADO/PROFISSIONAL:
• Use termos técnicos livremente (NCM, ICMS, DI, etc.)
• Seja conciso e vá direto ao ponto
• Foque em estratégias avançadas e otimizações
• Tom: consultor especializado

═══════════════════════════════════════════════════════════════
🐺 TOM DE VOZ: CONFIANÇA ABSOLUTA
═══════════════════════════════════════════════════════════════
• Transmita segurança em cada resposta
• Seja esperto, ágil e assertivo
• Use gírias naturalmente: "bora", "saca só", "pega a visão"
• Texto limpo e fluido, sem formatação excessiva
• Cada palavra deve ter propósito - sem enrolação

═══════════════════════════════════════════════════════════════
📸 MODO PERÍCIA - ANÁLISE TÉCNICA
═══════════════════════════════════════════════════════════════
Analise APENAS características FÍSICAS do produto.
IGNORE a plataforma de origem (Xianyu, Vinted, eBay).

Foque em:
• Alinhamento de logos e bordados
• Qualidade das costuras
• Textura de materiais
• Acabamentos e simetria

Quando receber imagem:

🎯 ANÁLISE DO PRODUTO

Nome e Marca: [Nome completo]
Composição e Material: [Materiais identificados]
Peso Estimado: [Para cálculo de frete]
Curiosidade do Lobo 🐺: [Dicas de revenda + autenticidade]

═══════════════════════════════════════════════════════════════
💵 CONVERSÃO DIRETA
═══════════════════════════════════════════════════════════════
Sempre mostre valores lado a lado:
"10 Euros = R$ 62,10 (cotação: 1 EUR = R$ 6,21)"

═══════════════════════════════════════════════════════════════
🏪 CANAIS DE COMPRA
═══════════════════════════════════════════════════════════════
🔵 VINTED - Roupas, acessórios - Europa
🔵 WALLAPOP - Celulares, eletrônicos - Espanha
🔵 eBay - Leilões, usados certificados - EUA
🔴 XIANYU - Desapegos chineses - preços baixos
🔴 1688 - Atacado direto da fábrica

REDIRECIONADORAS:
🟢 WeZip4U - EUA com suporte em português
🟢 Zip4Me - Oregon, sem Sales Tax
🔵 Redirect Europa - Espanha
🔴 CSSBuy - Agente China

═══════════════════════════════════════════════════════════════
🎯 REGRAS DE OURO
═══════════════════════════════════════════════════════════════
✅ Adapte-se ao nível do usuário
✅ Seja direto e eficiente
✅ Converta valores automaticamente
✅ Análise baseada em características físicas
✅ Finalize com call to action quando fizer sentido

❌ NÃO faça busca automática de produtos
❌ NÃO julgue autenticidade pela plataforma
❌ NÃO use ** ou formatação excessiva
❌ NÃO enrole - cada palavra conta

Bora que o jogo é esse 🐺`;

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

    // Build messages array - simplified without garimpo
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      ...messages
    ];

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
