import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('minicurso-files: missing Authorization header');
      return json({ error: 'Unauthorized', reason: 'no_auth' }, 401);
    }

    const anon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user?.email) {
      console.log('minicurso-files: invalid session');
      return json({ error: 'Unauthorized', reason: 'invalid_session' }, 401);
    }

    const email = user.email.toLowerCase();
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // All minicurso purchases for this user (by user_id OR by e-mail, case-insensitive)
    const [byUser, byEmail] = await Promise.all([
      admin.from('purchases').select('id,status,user_id,email,external_reference,created_at')
        .eq('product', 'minicurso').eq('user_id', user.id),
      admin.from('purchases').select('id,status,user_id,email,external_reference,created_at')
        .eq('product', 'minicurso').ilike('email', email),
    ]);

    if (byUser.error) console.error('minicurso-files: purchases by user_id error', byUser.error);
    if (byEmail.error) console.error('minicurso-files: purchases by email error', byEmail.error);

    const rows = [...(byUser.data ?? []), ...(byEmail.data ?? [])];
    const unique = Array.from(new Map(rows.map((r) => [r.id, r])).values());
    const approved = unique.find((r) => r.status === 'approved');
    const pending = unique.find((r) => r.status === 'pending');

    // Self-heal: link approved purchases made before/without login to this account
    if (approved && !approved.user_id) {
      const { error: linkError } = await admin.from('purchases')
        .update({ user_id: user.id }).eq('id', approved.id);
      if (linkError) console.error('minicurso-files: failed to link purchase to user', linkError);
      else console.log(`minicurso-files: linked purchase ${approved.id} to user ${user.id}`);
    }

    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!approved && !isAdminData) {
      const reason = pending ? 'payment_pending' : 'no_purchase';
      console.log(
        `minicurso-files: access DENIED user=${user.id} email=${email} reason=${reason} ` +
        `purchases_found=${unique.length} statuses=${unique.map((r) => r.status).join(',') || 'none'}`
      );
      return json({
        access: false,
        reason,
        files: [],
        purchases_found: unique.length,
        last_purchase_at: unique[0]?.created_at ?? null,
      });
    }

    console.log(
      `minicurso-files: access GRANTED user=${user.id} email=${email} ` +
      `via=${approved ? 'purchase' : 'admin'} purchase_id=${approved?.id ?? 'n/a'}`
    );

    const { data: objects, error: listError } = await admin.storage.from('minicurso').list('', { limit: 100 });
    if (listError) throw listError;

    const files = [] as Array<{ name: string; url: string; size: number | null }>;
    for (const obj of objects ?? []) {
      if (obj.name === '.emptyFolderPlaceholder') continue;
      const { data: signed } = await admin.storage.from('minicurso').createSignedUrl(obj.name, 60 * 15);
      if (signed?.signedUrl) {
        files.push({ name: obj.name, url: signed.signedUrl, size: obj.metadata?.size ?? null });
      }
    }

    console.log(`minicurso-files: returning ${files.length} files to ${email}`);
    return json({ access: true, reason: 'ok', files });
  } catch (error) {
    console.error('minicurso-files error:', error);
    return json({ error: 'Erro ao carregar arquivos', reason: 'server_error' }, 500);
  }
});
