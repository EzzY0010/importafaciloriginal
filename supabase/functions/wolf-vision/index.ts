import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store' };
const PROMPT = 'Analise esta foto em português. Responda com um resumo direto de 3 ou 4 palavras, como "boné de tecido leve". Descreva apenas categoria, cor, material aparente e características visíveis. Não mencione logotipo, marca, autenticidade ou composição técnica. Não invente informações.';
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...H, 'Content-Type': 'application/json' } });
const sse = (text: string) => { const enc = new TextEncoder(); const body = new ReadableStream({ start(c) { for (let i = 0; i < text.length; i += 400) c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text.slice(i, i + 400) } }] })}\n\n`)); c.enqueue(enc.encode('data: [DONE]\n\n')); c.close(); } }); return new Response(body, { headers: { ...H, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' } }); };

async function getUser(req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const url = Deno.env.get('SUPABASE_URL'); const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token || !url || !serviceKey) return null;
  const publicKey = req.headers.get('apikey') || serviceKey;
  const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data } = await client.auth.getUser(token);
  return data.user ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized', message: 'Sua sessão expirou. Entre novamente.' }, 401);
    const body = await req.json(); const messages = Array.isArray(body?.messages) ? body.messages : [];
    const last = messages[messages.length - 1]?.content; const parts = Array.isArray(last) ? last : [];
    const text = parts.filter((p: any) => p?.type === 'text').map((p: any) => String(p.text ?? '')).join(' ').slice(0, 500);
    const image = parts.find((p: any) => p?.type === 'image_url')?.image_url?.url;
    if (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) return json({ error: 'invalid_image', message: 'Envie uma foto JPG, PNG ou WEBP válida.' }, 400);
    const groqKey = Deno.env.get('GROQ_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!groqKey && !lovableKey) return json({ error: 'ai_key_missing', message: 'O provedor visual ainda não está configurado.' }, 503);
    if (lovableKey) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30000);
      let response: Response;
      try {
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST', headers: { 'Lovable-API-Key': lovableKey, 'Content-Type': 'application/json' }, signal: controller.signal,
          body: JSON.stringify({ model: 'openai/gpt-5.6-sol', messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: [{ type: 'text', text: text || 'Analise este produto.' }, { type: 'image_url', image_url: { url: image } }] }], temperature: 0.1, max_tokens: 80 }),
        });
      } finally { clearTimeout(timer); }
      if (!response.ok) { console.error('[wolf-vision] Lovable Vision failed', response.status); return json({ error: 'vision_unavailable', message: `O provedor visual recusou a imagem (status ${response.status}).` }, 503); }
      const payload = await response.json().catch(() => ({}));
      const answer = String(payload?.choices?.[0]?.message?.content ?? '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' ');
      return answer ? sse(answer) : json({ error: 'vision_unavailable', message: 'A IA não conseguiu interpretar essa foto.' }, 503);
    }
    const preferred = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.2-11b-vision-preview'];
    const modelList = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${groqKey}` } });
    if (!modelList.ok) {
      console.error('[wolf-vision] Groq model list failed', modelList.status);
      return json({ error: 'vision_unavailable', message: `O provedor visual recusou a conexão (status ${modelList.status}).` }, 503);
    }
    const listed = await modelList.json().catch(() => ({}));
    const available = (listed?.data ?? []).map((item: any) => String(item?.id ?? '')).filter(Boolean);
    const discovered = available.filter((id: string) => /vision|llama-4|scout|maverick/i.test(id) && !/guard|whisper|audio|tts|compound/i.test(id));
    const candidates = [...preferred.filter((id) => available.includes(id)), ...discovered].filter((id, index, all) => all.indexOf(id) === index);
    if (!candidates.length) {
      console.error('[wolf-vision] no visual model available', { modelCount: available.length });
      return json({ error: 'vision_unavailable', message: 'Não há modelo visual ativo na conta Groq.' }, 503);
    }
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30000);
    let response: Response | null = null; let lastStatus = 503;
    try {
      for (const model of candidates) {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ model, messages: [{ role: 'system', content: PROMPT }, { role: 'user', content: [{ type: 'text', text: text || 'Analise este produto.' }, { type: 'image_url', image_url: { url: image } }] }], temperature: 0.1, max_tokens: 80 }) });
        lastStatus = response.status;
        if (response.ok) break;
        if (![400, 404, 415].includes(response.status)) break;
      }
    } finally { clearTimeout(timer); }
    if (!response?.ok) {
      console.error('[wolf-vision] all visual models failed', { lastStatus, tried: candidates.length });
      return json({ error: lastStatus === 429 ? 'quota_exhausted' : 'vision_unavailable', message: `O modelo visual recusou a imagem (status ${lastStatus}).` }, lastStatus === 429 ? 429 : 503);
    }
    const payload = await response.json().catch(() => ({}));
    const answer = String(payload?.choices?.[0]?.message?.content ?? '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' ');
    return answer ? sse(answer) : json({ error: 'vision_unavailable', message: 'A IA não conseguiu interpretar essa foto.' }, 503);
  } catch (error) {
    console.error('[wolf-vision]', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'vision_timeout', message: 'A análise demorou mais que o esperado. Tente uma foto menor.' }, 504);
  }
});
