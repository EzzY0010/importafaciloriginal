import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadPayload {
  full_name?: string;
  whatsapp?: string;
  email?: string;
  reason?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as LeadPayload;
    const full_name = (body.full_name ?? '').trim();
    const whatsapp = (body.whatsapp ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const reason = (body.reason ?? '').trim();

    if (full_name.length < 2 || whatsapp.length < 8 || !email.includes('@') || reason.length < 2) {
      return new Response(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data, error } = await admin
      .from('leads')
      .insert({
        full_name,
        whatsapp,
        email,
        reason,
        source: body.source ?? 'pre-signup',
        metadata: body.metadata ?? {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[lead-capture] insert error', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fire-and-forget webhook (Evolution API / n8n / etc.) — configured later via LEAD_WEBHOOK_URL
    const webhook = Deno.env.get('LEAD_WEBHOOK_URL');
    if (webhook) {
      queueMicrotask(async () => {
        try {
          await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id, full_name, whatsapp, email, reason }),
          });
        } catch (err) {
          console.error('[lead-capture] webhook error', err);
        }
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[lead-capture] fatal', err);
    return new Response(JSON.stringify({ error: 'Falha ao processar lead' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});