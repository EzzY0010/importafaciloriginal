// Backup photo reader through the Lovable AI Gateway. Used only when the
// direct Google Gemini call cannot run (missing/invalid key, unavailable
// model, quota, timeout or network), so a photo is always analyzed.
import { generateChatCompletion, GatewayError } from 'npm:@lovable.dev/ai-gateway';
import { VisionError } from './gemini-vision.ts';

export const BACKUP_VISION_MODEL = 'google/gemini-2.5-flash';

export async function generateBackupVisual(options: {
  prompt: string; text: string; images: { mime_type: string; data: string }[];
}): Promise<{ text: string; model: string }> {
  try {
    const completion = await generateChatCompletion({
      model: BACKUP_VISION_MODEL,
      messages: [
        { role: 'system', content: options.prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${options.text}\nResponda somente em JSON.` },
            ...options.images.map((image) => ({ type: 'image_url' as const, image_url: { url: `data:${image.mime_type};base64,${image.data}` } })),
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    } as never);
    // deno-lint-ignore no-explicit-any
    const text = String((completion as any)?.choices?.[0]?.message?.content ?? '').trim();
    if (!text) throw new VisionError('incomplete_analysis', 503, 'A análise não foi concluída. Envie a foto novamente.');
    return { text, model: BACKUP_VISION_MODEL };
  } catch (error) {
    if (error instanceof VisionError) throw error;
    if (error instanceof GatewayError) {
      // deno-lint-ignore no-explicit-any
      const e = error as any;
      console.error('[lovable-vision] gateway failure', { code: e.code, status: e.httpStatus, outcome: e.outcome, ids: e.ids });
      if (e.httpStatus === 429) throw new VisionError('rate_limit', 429, 'Muitas análises ao mesmo tempo. Aguarde alguns segundos e tente de novo.');
      if (e.httpStatus === 402) throw new VisionError('quota_exhausted', 402, 'Os créditos de IA acabaram. Avise o responsável pelo site.');
      if (e.httpStatus === 400) throw new VisionError('invalid_image', 400, 'Não consegui ler esta foto. Envie outra imagem mais nítida.');
      throw new VisionError('vision_unavailable', 503, 'A análise por foto falhou agora. Tente novamente em instantes.');
    }
    console.error('[lovable-vision] unexpected failure', { name: (error as Error)?.name, message: (error as Error)?.message?.slice(0, 200) });
    throw new VisionError('vision_unavailable', 503, 'A análise por foto falhou agora. Tente novamente em instantes.');
  }
}
