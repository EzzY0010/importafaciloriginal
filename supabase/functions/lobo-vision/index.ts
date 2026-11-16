import { createClient } from "npm:@supabase/supabase-js@2";
import {
  generateVisual,
  parseImage,
  VisionError,
} from "../_shared/gemini-vision.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const AUTH_TIMEOUT_MS = 10_000;
const PROMPT =
  "Analise visualmente a peça. Responda em português, com: Produto identificado; Categoria; Material aparente; Cor; Peso estimado em gramas; Observação. O peso é uma estimativa visual. Não estime nem mencione preço de mercado, venda ou revenda no Brasil para nenhuma peça. Não mencione logo, marca, autenticidade ou nomes comerciais. Não peça o nome do produto.";

type AuthResult = "authorized" | "unauthorized" | "unavailable";
type ImagePart = { type?: string; image_url?: { url?: unknown } };
type TextPart = { type?: string; text?: unknown };
type IncomingMessage = { content?: unknown };

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

async function authorize(req: Request): Promise<AuthResult> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  ).trim();
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!jwt || !url || !key) return "unauthorized";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const client = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }),
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await client.auth.getUser(jwt);
    if (error) return error.status === 401 ? "unauthorized" : "unavailable";
    return data.user ? "authorized" : "unauthorized";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}

function sse(text: string) {
  return new Response(
    `data: ${
      JSON.stringify({ choices: [{ delta: { content: text } }] })
    }\n\ndata: [DONE]\n\n`,
    {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = await authorize(req);
  if (auth === "unauthorized") {
    return json({
      error: "unauthorized",
      message: "Sua sessão expirou. Entre novamente.",
    }, 401);
  }
  if (auth === "unavailable") {
    return json({
      error: "auth_unavailable",
      message:
        "Não foi possível validar sua sessão agora. Tente novamente em instantes.",
    }, 503);
  }

  try {
    const body = await req.json().catch(() => null) as
      | { messages?: unknown }
      | null;
    const messages = Array.isArray(body?.messages)
      ? body.messages as IncomingMessage[]
      : [];
    const latest = messages.at(-1);
    const parts = Array.isArray(latest?.content)
      ? latest.content as Array<ImagePart | TextPart>
      : [];
    const imageUrl = parts.find((part): part is ImagePart =>
      part.type === "image_url"
    )?.image_url?.url;
    const note = parts
      .filter((part): part is TextPart => part.type === "text")
      .map((part) => typeof part.text === "string" ? part.text : "")
      .join(" ")
      .slice(0, 500);

    const image = parseImage(imageUrl);
    const result = await generateVisual({
      apiKey: Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      prompt: PROMPT,
      text: note || "Analise esta peça.",
      images: [image],
      timeoutMs: { modelList: 6_000, generation: 65_000 },
    });
    return sse(result.text);
  } catch (error) {
    if (error instanceof VisionError) {
      console.warn("[lobo-vision] analysis failed", {
        code: error.code,
        status: error.status,
      });
      return json({ error: error.code, message: error.message }, error.status);
    }
    console.error(
      "[lobo-vision] analysis failed",
      error instanceof Error ? error.name : "unknown",
    );
    return json({
      error: "vision_unavailable",
      message:
        "O Gemini não conseguiu ler a peça agora. Tente novamente em instantes.",
    }, 503);
  }
});
