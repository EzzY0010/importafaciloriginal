import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICE = 12.0;
const WHATSAPP_NUMBER = '5511958690389';

const ALLOWED: Record<string, string[]> = {
  Vinted: ['Espanha', 'Reino Unido', 'Portugal'],
  Depop: ['EUA'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { service?: string; country?: string } = {};
    try { body = await req.json(); } catch { /* empty */ }

    const service = typeof body.service === 'string' ? body.service : '';
    const country = typeof body.country === 'string' ? body.country : '';

    if (!ALLOWED[service] || !ALLOWED[service].includes(country)) {
      return new Response(JSON.stringify({ error: 'Serviço ou país inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Payment configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // After payment approval, send the customer straight to WhatsApp with the request pre-filled
    const message = `Opa alê, paguei o número virtual! Preciso de um número da ${service} do ${country} gera pra mim...`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

    const externalReference = `virtual-number:${service}:${country}:${Date.now()}`;

    const preferenceData = {
      items: [{
        id: 'numero-virtual',
        title: `Número Virtual SMS - ${service} (${country})`,
        description: `Número virtual para verificação SMS na ${service} - ${country}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: PRICE,
      }],
      back_urls: {
        success: whatsappUrl,
        failure: whatsappUrl,
        pending: whatsappUrl,
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'IMPORTAFACIL',
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preferenceData),
    });

    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Virtual number preference created: ${service}/${country} - R$ ${PRICE}`);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
