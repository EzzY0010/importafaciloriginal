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
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty for some notifications
    }

    console.log('Webhook received:', { topic, id, body });

    // Handle payment notification
    if (topic === 'payment' || body.type === 'payment') {
      const paymentId = id || body.data?.id;
      
      if (!paymentId) {
        console.log('No payment ID found');
        return new Response('OK', { status: 200, headers: corsHeaders });
      }

      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      
      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const paymentData = await mpResponse.json();
      console.log('Payment data:', JSON.stringify(paymentData));

      if (paymentData.status === 'approved') {
        const adminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Update payment record
        const { error: paymentError } = await adminClient.from('payments')
          .update({
            status: 'approved',
            mercadopago_id: paymentId.toString(),
            payment_method: paymentData.payment_type_id
          })
          .eq('external_reference', paymentData.external_reference);

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        }

        // Extract user_id from external_reference (format: userId_timestamp)
        const userId = paymentData.external_reference?.split('_')[0];
        
        if (userId) {
          // Mark user as paid
          const { error: profileError } = await adminClient.from('profiles')
            .update({ has_paid: true })
            .eq('id', userId);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          } else {
            console.log(`User ${userId} marked as paid`);
          }
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
