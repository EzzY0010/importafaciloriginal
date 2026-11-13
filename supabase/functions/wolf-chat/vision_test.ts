import { generateVisual, parseImage, selectVisualModels, VisionError } from '../_shared/gemini-vision.ts';
function assert(value: boolean) { if (!value) throw new Error('Assertion failed'); }
Deno.test('discovery prioritizes current Flash and excludes non-image surfaces', () => {
  const models = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.1-pro', 'gemini-3-flash-tts', 'gemini-2.0-flash'].map(id => ({ name: `models/${id}`, supportedGenerationMethods: ['generateContent'] }));
  const chosen = selectVisualModels(models);
  assert(chosen[0] === 'gemini-3.5-flash');
  assert(!chosen.includes('gemini-3-flash-tts'));
  assert(selectVisualModels([{ name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'], inputModalities: ['TEXT'] }]).length === 0);
});
Deno.test('missing key has a safe specific error', async () => {
  try { await generateVisual({ prompt: '', text: '', images: [] }); throw new Error('Expected failure'); }
  catch (error) { assert(error instanceof VisionError && error.code === 'ai_key_missing'); }
});
Deno.test('invalid and oversized images are rejected', () => {
  for (const [value, code] of [['data:image/jpeg;base64,AAAA', 'invalid_image'], ['data:image/jpeg;base64,' + 'A'.repeat(4_194_308), 'payload_too_large']]) {
    try { parseImage(value); throw new Error('Expected failure'); }
    catch (error) { assert(error instanceof VisionError && error.code === code); }
  }
});
Deno.test('unavailable model falls through to next discovered model', async () => {
  let generations = 0;
  const fetcher: typeof fetch = async (input) => {
    if (String(input).includes('generateContent')) {
      generations++;
      return generations === 1 ? Response.json({ error: { status: 'NOT_FOUND' } }, { status: 404 }) : Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Produto: camiseta.' }] } }] });
    }
    return Response.json({ models: ['gemini-3.5-flash', 'gemini-2.5-flash'].map(id => ({ name: `models/${id}`, supportedGenerationMethods: ['generateContent'] })) });
  };
  const result = await generateVisual({ apiKey: 'test-fixture-not-a-credential', prompt: '', text: '', images: [], fetcher });
  assert(result.model === 'gemini-2.5-flash' && generations === 2);
});
Deno.test('quota failure does not replay requests or masquerade as no vision', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return Response.json({ error: { status: 'RESOURCE_EXHAUSTED' } }, { status: 429 }); };
  try { await generateVisual({ apiKey: 'test-fixture-not-a-credential', prompt: '', text: '', images: [], fetcher }); throw new Error('Expected failure'); }
  catch (error) { assert(error instanceof VisionError && error.code === 'quota_exhausted' && calls === 1); }
});
Deno.test('slow model discovery returns a bounded vision timeout', async () => {
  const fetcher: typeof fetch = async (_input, init) => await new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  try {
    await generateVisual({
      apiKey: 'test-fixture-not-a-credential', prompt: '', text: '', images: [], fetcher,
      timeoutMs: { modelList: 5, generation: 5 },
    });
    throw new Error('Expected timeout');
  } catch (error) {
    assert(error instanceof VisionError && error.code === 'vision_timeout' && error.status === 504);
  }
});
