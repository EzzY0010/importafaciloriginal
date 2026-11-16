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
  "Identifique a peça da foto. Responda SOMENTE com 3 ou 4 palavras em português, por exemplo: boné de tecido leve. Não mencione logo, marca, autenticidade ou nomes comerciais.";

type AuthResult = "authorized" | "unauthorized" | "unavailable";

const reply = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

async function authenticate(req: Request): Promise<AuthResult> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  ).trim();
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!jwt) return "unauthorized";
  if (!url || !key) return "unavailable";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405);

  const auth = await authenticate(req);
  if (auth === "unauthorized") {
    return reply({
      error: "unauthorized",
      message: "Sua sessão expirou. Entre novamente.",
    }, 401);
  }
  if (auth === "unavailable") {
    return reply({
      error: "auth_unavailable",
      message:
        "Não foi possível validar sua sessão agora. Tente novamente em instantes.",
    }, 503);
  }

  try {
    const body = await req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const image = parseImage(body?.imageData);
    const name = typeof body?.productName === "string"
      ? body.productName.trim().slice(0, 160)
      : "";
    const result = await generateVisual({
      apiKey: Deno.env.get("GOOGLE_GEMINI_API_KEY"),
      prompt: PROMPT,
      text: `Nome informado: ${name || "nenhum"}`,
      images: [image],
      timeoutMs: { modelList: 6_000, generation: 65_000 },
    });
    const suggestion = result.text.replace(/\s+/g, " ").trim().split(" ").slice(
      0,
      4,
    ).join(" ");
    if (!suggestion) {
      return reply({
        error: "incomplete_analysis",
        message: "A análise não retornou uma descrição.",
      }, 503);
    }
    return reply({ suggestion, declaration: null, reviewRequired: true });
  } catch (error) {
    if (error instanceof VisionError) {
      console.warn("[product-description] analysis failed", {
        code: error.code,
        status: error.status,
      });
      return reply({ error: error.code, message: error.message }, error.status);
    }
    console.error(
      "[product-description] analysis failed",
      error instanceof Error ? error.name : "unknown",
    );
    return reply({
      error: "vision_unavailable",
      message:
        "Não foi possível ler a foto agora. Tente novamente em instantes.",
    }, 503);
  }
});
