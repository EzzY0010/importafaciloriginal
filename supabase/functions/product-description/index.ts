import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { generateVisual, parseImage, VisionError } from '../_shared/gemini-vision.ts';
import { CUSTOMS_PROMPT, buildCustomsDescription } from '../_shared/customs-description.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'server_configuration', message: 'Serviço temporariamente indisponível.' }, 500);
    }

    const authorization = req.headers.get('Authorization') ?? '';
    const jwt = authorization.replace(/^Bearer\s+/i, '');
    if (!jwt) return jsonResponse({ error: 'unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData } = await supabase.auth.getUser(jwt);
    const authUser = authData?.user;
    if (!authUser) return jsonResponse({ error: 'unauthorized' }, 401);

    const [{ data: active, error: accessRpcError }, { data: isAdmin }] = await Promise.all([
      supabase.rpc('has_full_access', { _user_id: authUser.id }),
      supabase.rpc('has_role', { _user_id: authUser.id, _role: 'admin' }),
    ]);

    const { data: profile } = await supabase
      .from('profiles')
      .select('has_paid, plan_type, plan_expires_at, legacy_access')
      .eq('id', authUser.id)
      .maybeSingle();

    const profilePlan = String(profile?.plan_type ?? '').toLowerCase();
    const profileExpiry = profile?.plan_expires_at ? Date.parse(profile.plan_expires_at) : NaN;
    const profileHasFullAccess = profile?.has_paid === true && (profile?.legacy_access === true
      || (profile?.has_paid === true
        && profilePlan !== 'beginners'
        && profilePlan !== 'grupo'
        && Number.isFinite(profileExpiry) && profileExpiry > Date.now()));
    const hasFullAccess = Boolean(active) || profileHasFullAccess;

    if (!hasFullAccess && !isAdmin) {
      console.log('[product-description] acesso negado', {
        userId: authUser.id,
        accessRpcError: accessRpcError?.message,
        profilePlan,
      });
      return jsonResponse({ error: 'subscription_expired' }, 403);
    }
    if (!isAdmin && profile?.plan_type === 'beginners' && profile.legacy_access !== true) {
      return jsonResponse({
        error: 'beginners_plan_restricted',
        message: 'A análise por IA está disponível no Importafacil Elite.',
      }, 403);
    }

    let body: { imageData?: unknown; productName?: unknown };
    try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid_request', message: 'Envie uma foto válida.' }, 400); }
    const image = parseImage(body.imageData);
    const result = await generateVisual({
      apiKey: Deno.env.get('GOOGLE_GEMINI_API_KEY'),
      prompt: CUSTOMS_PROMPT,
      text: 'Identifique a categoria e os atributos observáveis do produto para uma descrição aduaneira neutra.',
      images: [image], json: true,
    });
    let attributes: unknown;
    try { attributes = JSON.parse(result.text); } catch { throw new VisionError('invalid_analysis', 503, 'A análise não gerou uma descrição válida. Tente outra foto.'); }
    const suggestion = buildCustomsDescription(attributes);
    return jsonResponse({ suggestion, declaration: null, model: result.model, reviewRequired: true });
  } catch (error) {
    if (error instanceof VisionError) return jsonResponse({ error: error.code, message: error.message }, error.status);
    console.error('[product-description] internal failure');
    return jsonResponse({ error: 'internal_error', message: 'Não foi possível analisar essa foto agora.' }, 500);
  }
});
