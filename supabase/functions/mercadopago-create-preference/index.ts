import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!accessToken) {
      console.error('Missing MERCADO_PAGO_ACCESS_TOKEN');
      return new Response(JSON.stringify({ error: 'Payment configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const externalReference = `${user.id}_${Date.now()}`;
    const origin = req.headers.get('origin') || 'https://lovable.dev';

    // Create payment record
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await adminClient.from('payments').insert({
      user_id: user.id,
      external_reference: externalReference,
      amount: 12.00,
      status: 'pending'
    });

    // Create Mercado Pago preference
    const preferenceData = {
      items: [{
        id: 'importafacil-access',
        title: 'ImportaFácil - Acesso Vitalício',
        description: 'Acesso completo ao ImportaFácil com IA e calculadora de importação',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 12.00
      }],
      payer: {
        email: user.email
      },
      back_urls: {
        success: `${origin}/dashboard?payment=success`,
        failure: `${origin}/dashboard?payment=failure`,
        pending: `${origin}/dashboard?payment=pending`
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      statement_descriptor: 'IMPORTAFACIL'
    };

    console.log('Creating preference:', JSON.stringify(preferenceData));

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const mpData = await mpResponse.json();
    console.log('MP Response:', JSON.stringify(mpData));

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update payment with preference_id
    await adminClient.from('payments')
      .update({ preference_id: mpData.id })
      .eq('external_reference', externalReference);

    return new Response(JSON.stringify({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      preference_id: mpData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
