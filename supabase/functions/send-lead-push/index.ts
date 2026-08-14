import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { title, body, url } = await req.json().catch(() => ({}));

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@importafacil.app';

    if (!publicKey || !privateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys ausentes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Somente dispositivos de usuários com role = admin
    const { data: admins } = await admin.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = (admins ?? []).map((r: { user_id: string }) => r.user_id);
    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .in('user_id', adminIds);

    const payload = JSON.stringify({
      title: title || 'Novo lead recebido!',
      body: body || 'Um novo lead acabou de preencher o formulário',
      url: url || '/admin',
      tag: 'novo-lead',
    });

    let sent = 0;
    const dead: string[] = [];

    await Promise.all(
      (subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          console.error('[send-lead-push] falha', status, String(err));
          if (status === 404 || status === 410) dead.push(s.id);
        }
      }),
    );

    if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-lead-push] fatal', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
