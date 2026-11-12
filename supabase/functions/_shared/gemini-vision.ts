const BASE = 'https://generativelanguage.googleapis.com/v1beta';
export class VisionError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}
export function parseImage(value: unknown): { mime_type: string; data: string } {
  if (typeof value !== 'string') throw new VisionError('invalid_image', 400, 'Envie uma foto JPG, PNG ou WEBP válida.');
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) throw new VisionError('invalid_image', 400, 'Envie uma foto JPG, PNG ou WEBP válida.');
  if (match[2].length > 4_194_304) throw new VisionError('payload_too_large', 413, 'A foto comprimida deve ter até 3 MB. Escolha uma foto menor.');
  let bytes: string;
  try { bytes = atob(match[2]); } catch { throw new VisionError('invalid_image', 400, 'A foto está corrompida. Selecione outra imagem.'); }
  const valid = match[1] === 'image/jpeg' ? bytes.startsWith('\xff\xd8\xff')
    : match[1] === 'image/png' ? bytes.startsWith('\x89PNG\r\n\x1a\n')
    : bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
  if (!valid) throw new VisionError('invalid_image', 400, 'O conteúdo do arquivo não é uma imagem válida.');
  return { mime_type: match[1], data: match[2] };
}
interface Model { name: string; supportedGenerationMethods?: string[]; inputModalities?: string[]; }
export function selectVisualModels(models: Model[]): string[] {
  // models.list may omit modality metadata. Restrict to documented multimodal
  // Gemini 1.5+ general-purpose families; generation verifies actual image support.
  return [...new Set(models.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .filter(m => /^models\/gemini-(?:1\.5|[2-9](?:\.\d+)?)-(?:flash|pro)/i.test(m.name))
    .filter(m => !/tts|live|image|audio|robotics|computer-use/i.test(m.name))
    .filter(m => !m.inputModalities || m.inputModalities.some(v => v.toLowerCase() === 'image'))
    .map(m => m.name.replace(/^models\//, '')))]
    .sort((a, b) => {
      const rank = (id: string) => Number(id.match(/gemini-([\d.]+)/)?.[1] ?? 0) * 100
        + (id.includes('flash') ? 1000 : 0) - (/lite/.test(id) ? 10 : 0) - (/preview|exp/.test(id) ? 5 : 0);
      return rank(b) - rank(a) || a.localeCompare(b);
    });
}
function providerError(status: number, payload: unknown): VisionError {
  const code = typeof payload === 'object' && payload !== null && 'error' in payload
    ? JSON.stringify(payload.error) : '';
  if (status === 429) return new VisionError('quota_exhausted', 429, 'A cota do Google Gemini foi atingida. Aguarde a renovação da cota ou solicite a revisão ao responsável pelo site.');
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid/i.test(code)) return new VisionError('ai_key_invalid', 503, 'A chave do Google Gemini precisa ser revisada pelo responsável pelo site.');
  if (status === 404) return new VisionError('model_unavailable', 503, 'O modelo visual está indisponível. Tente novamente mais tarde.');
  if (status === 400 && /image|decode|mime|base64/i.test(code)) return new VisionError('invalid_image', 400, 'O Google não conseguiu ler esta foto. Envie outra imagem mais nítida.');
  return new VisionError('vision_unavailable', 503, 'A análise por foto está indisponível no momento. Tente novamente mais tarde.');
}
export async function generateVisual(options: { apiKey?: string; prompt: string; text: string; images: ReturnType<typeof parseImage>[]; json?: boolean; fetcher?: typeof fetch }) {
  if (!options.apiKey) throw new VisionError('ai_key_missing', 503, 'A análise por foto ainda não está configurada. O responsável deve cadastrar GOOGLE_GEMINI_API_KEY no campo seguro.');
  const fetcher = options.fetcher ?? fetch;
  const headers = { 'x-goog-api-key': options.apiKey, 'Content-Type': 'application/json' };
  let listed: Model[] = [];
  let pageToken = '';
  try {
    do {
      const url = new URL(`${BASE}/models`);
      url.searchParams.set('pageSize', '1000');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetcher(url, { headers });
      const payload = await response.json();
      if (!response.ok) throw providerError(response.status, payload);
      if (Array.isArray(payload.models)) listed.push(...payload.models);
      pageToken = typeof payload.nextPageToken === 'string' ? payload.nextPageToken : '';
    } while (pageToken);
    const models = selectVisualModels(listed);
    if (!models.length) throw new VisionError('model_unavailable', 503, 'Nenhum modelo Gemini multimodal está disponível para esta conta.');
    let lastError = new VisionError('model_unavailable', 503, 'Os modelos visuais disponíveis não conseguiram analisar a foto.');
    for (const model of models.slice(0, 6)) {
      const response = await fetcher(`${BASE}/models/${model}:generateContent`, {
        method: 'POST', headers,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: options.prompt }] },
          contents: [{ role: 'user', parts: [{ text: options.text }, ...options.images.map(image => ({ inline_data: image }))] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096, ...(options.json ? { responseMimeType: 'application/json' } : {}) },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        lastError = providerError(response.status, payload);
        console.warn('[gemini-vision] model rejected', { model, status: response.status, code: lastError.code });
        if (['ai_key_invalid', 'quota_exhausted', 'invalid_image'].includes(lastError.code)) throw lastError;
        continue;
      }
      const candidate = payload.candidates?.[0];
      if (payload.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') throw new VisionError('image_refused', 422, 'Não foi possível analisar essa imagem. Envie uma foto somente do produto.');
      if (candidate?.finishReason === 'MAX_TOKENS') throw new VisionError('incomplete_analysis', 503, 'A análise não foi concluída. Tente uma foto focada no produto.');
      const text = (candidate?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('').trim();
      if (!text) continue;
      console.log('[gemini-vision] image analyzed', { provider: 'google-gemini', model, imageCount: options.images.length });
      return { text, model };
    }
    throw lastError;
  } catch (error) {
    if (error instanceof VisionError) throw error;
    // Never log network exceptions: they can contain credential-bearing headers.
    throw new VisionError('ai_network_error', 502, 'Não foi possível conectar ao Google Gemini. Tente novamente mais tarde.');
  }
}