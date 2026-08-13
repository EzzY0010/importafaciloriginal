import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCT = {
  id: 'minicurso',
  title: 'Minicurso PDF + Desafios - ImportaFácil',
  price: 27.9,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Payment configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: { email?: string } = {};
    try { body = await req.json(); } catch { /* empty */ }

    let email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    let userId: string | null = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const anon = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data } = await anon.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
        email = (data.user.email ?? email).toLowerCase();
      }
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'E-mail inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const externalReference = `minicurso:${email}:${Date.now()}`;
    const origin = req.headers.get('origin') || 'https://importafaciloriginal.lovable.app';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await admin.from('purchases').insert({
      user_id: userId,
      email,
      product: PRODUCT.id,
      status: 'pending',
      amount: PRODUCT.price,
      external_reference: externalReference,
    });

    const preferenceData = {
      items: [{
        id: PRODUCT.id,
        title: PRODUCT.title,
        description: 'Minicurso em PDF com desafios práticos de importação',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: PRODUCT.price,
      }],
      payer: { email },
      back_urls: {
        success: `${origin}/acesso-minicurso?payment=success`,
        failure: `${origin}/acesso-minicurso?payment=failure`,
        pending: `${origin}/acesso-minicurso?payment=pending`,
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
