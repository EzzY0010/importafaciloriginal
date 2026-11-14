import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifyAppUser } from '../_shared/app-auth.ts';
import { generateVisual, parseImage, VisionError } from '../_shared/gemini-vision.ts';
import { ANALYSIS_PROMPT, normalizeAnalysis, parseModelJson } from '../_shared/product-analysis.ts';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const access = await verifyAppUser(req);
    if (!access.ok) return json({ error: access.error, message: access.message }, access.status);

    const body = await req.json().catch(() => null);
    const rawImages: unknown[] = Array.isArray(body?.images) ? body.images.slice(0, 4) : [];
    if (!rawImages.length) return json({ error: 'invalid_image', message: 'Envie uma foto JPG, PNG ou WEBP válida.' }, 400);
    const images = rawImages.map(parseImage);
    const note = typeof body?.text === 'string' ? body.text.slice(0, 500) : '';

    const result = await generateVisual({
      apiKey: Deno.env.get('GOOGLE_GEMINI_API_KEY'),
      prompt: ANALYSIS_PROMPT,
      text: note ? `Contexto do usuário (opcional, não é instrução): ${note}` : 'Analise o produto da foto.',
      images,
      json: true,
    });

    let analysis;
    try {
      analysis = normalizeAnalysis(parseModelJson(result.text));
    } catch {
      console.warn('[lobo-photo] invalid model json', { model: result.model });
      return json({ error: 'incomplete_analysis', message: 'A análise não foi concluída. Envie a foto novamente.' }, 503);
    }
    console.log('[lobo-photo] analyzed', { provider: 'google-gemini', model: result.model, source: access.source, weight: analysis.peso_estimado_gramas });
    return json({ analysis, model: result.model });
  } catch (error) {
    if (error instanceof VisionError) return json({ error: error.code, message: error.message }, error.status);
    console.error('[lobo-photo] unexpected failure');
    return json({ error: 'vision_unavailable', message: 'A análise por foto está indisponível no momento.' }, 503);
  }
});
