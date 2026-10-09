import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns only the local status of a CN Pay order (never queries CN Pay from the browser).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const out = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const { identifier } = await req.json().catch(() => ({}));
    if (typeof identifier !== "string" || identifier.length < 10 || identifier.length > 120) return out({ error: "invalid" }, 400);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const table = identifier.startsWith("minicurso_") ? "purchases" : "payments";
    const { data } = await admin.from(table).select("status").eq("external_reference", identifier).maybeSingle();
    return out({ status: data?.status ?? "not_found" });
  } catch {
    return out({ status: "unknown" });
  }
});
