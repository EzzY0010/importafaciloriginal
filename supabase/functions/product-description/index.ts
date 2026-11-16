import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildCustomsDescription, CUSTOMS_PROMPT } from '../_shared/customs-description.ts';
import { generateVisual, parseImage, VisionError } from '../_shared/gemini-vision.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
});

async function isAuthorized(req: Request): Promise<boolean> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token || !url || !serviceKey) return false;
  const { data, error } = await createClient(url, serviceKey, { auth: { persistSession: false } }).auth.getUser(token);
  return Boolean(data.user && !error);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);

  try {
    if (!await isAuthorized(req)) {
      return reply({ error: 'unauthorized', message: 'Sua sessão expirou. Entre novamente.' }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return reply({ error: 'invalid_request', message: 'Envie uma foto válida do produto.' }, 400);
    }

    const image = parseImage((body as Record<string, unknown>).imageData);
    const result = await generateVisual({
      apiKey: Deno.env.get('GOOGLE_GEMINI_API_KEY'),
      prompt: CUSTOMS_PROMPT,
      text: 'Sugira uma descrição aduaneira curta e neutra. Inclua somente o material aparente se ele for visível; não infira composição.',
      images: [image],
      json: true,
    });

    let attributes: unknown;
    try {
      attributes = JSON.parse(result.text);
    } catch {
      throw new VisionError('invalid_analysis', 503, 'A análise não gerou uma descrição válida. Tente outra foto.');
    }

    let suggestion: string;
    try {
      suggestion = buildCustomsDescription(attributes);
    } catch {
      throw new VisionError('invalid_analysis', 503, 'A análise não gerou uma descrição válida. Tente outra foto.');
    }

    if (suggestion.startsWith('Produto não identificável')) {
      return reply({
        error: 'product_not_identified',
        message: 'Não consegui identificar o produto com segurança. Envie uma foto mais nítida, mostrando o item inteiro.',
      }, 422);
    }

    console.log('[product-description] image analyzed', { provider: 'google-gemini', model: result.model });
    return reply({ suggestion, model: result.model, reviewRequired: true });
  } catch (error) {
    if (error instanceof VisionError) {
      console.warn('[product-description] analysis error', { code: error.code, status: error.status });
      return reply({ error: error.code, message: error.message }, error.status);
    }
    console.error('[product-description] analysis failed');
    return reply({ error: 'internal_error', message: 'Não foi possível ler a foto agora. Tente novamente.' }, 500);
  }
});
