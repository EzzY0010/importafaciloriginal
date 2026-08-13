import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await anon.auth.getUser();
    const user = userData?.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: purchase } = await admin
      .from('purchases')
      .select('id')
      .eq('product', 'minicurso')
      .eq('status', 'approved')
      .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
      .limit(1)
      .maybeSingle();

    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!purchase && !isAdminData) {
      return new Response(JSON.stringify({ access: false, files: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    return new Response(JSON.stringify({ access: true, files }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('minicurso-files error:', error);
    return new Response(JSON.stringify({ error: 'Erro ao carregar arquivos' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
