import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANS: Record<string, { name: string; price: number }> = {
  mensal: { name: "Mentoria (plano mensal)", price: 97 },
  trimestral: { name: "Mentoria (plano trimestral)", price: 239 },
  anual: { name: "Mentoria (plano anual)", price: 499 },
  autonomo: { name: "Acesso ao Site (plano mensal)", price: 34.99 },
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const validCPF = (raw: string) => {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return json({ error: "Faça login para gerar o Pix." }, 401);

    const { planId, name, phone, document } = await req.json();
    const plan = PLANS[planId];
    if (!plan) return json({ error: "Plano inválido." }, 400);
    if (!name || String(name).trim().length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (!validCPF(String(document ?? ""))) return json({ error: "CPF inválido." }, 400);

    const identifier = `${user.id}_${planId}_${Date.now()}`;
    const payload = {
      identifier,
      amount: plan.price,
      client: { name: String(name).trim(), email: user.email, phone: String(phone ?? ""), document: String(document) },
      products: [{ id: planId, name: plan.name, quantity: 1, price: plan.price }],
      metadata: { provider: "ImportaFacil", orderId: identifier },
      callbackUrl: `${url}/functions/v1/appcnpay-webhook`,
    };

    const r = await fetch("https://painel.appcnpay.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": Deno.env.get("APPCNPAY_PUBLIC_KEY")!,
        "x-secret-key": Deno.env.get("APPCNPAY_PRIVATE_KEY")!,
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    console.log("[appcnpay-pix] status", r.status, "tx", data?.transactionId, "st", data?.status, "err", data?.message ?? data?.errorDescription);
    if (!r.ok || !data?.pix?.code) {
      return json({ error: "Não foi possível gerar o Pix, tente novamente.", detail: data?.message ?? data?.errorDescription }, 502);
    }

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin.from("payments").insert({
      user_id: user.id,
      amount: plan.price,
      external_reference: identifier,
      status: "pending",
      payment_method: "pix",
      mercadopago_id: data.transactionId,
      preference_id: data.webhookToken ?? null,
    });
    if (error) console.error("[appcnpay-pix] insert error", error);

    return json({ transactionId: data.transactionId, code: data.pix.code, image: data.pix.image ?? null, expiresAt: data.pix.expiresAt ?? null, amount: plan.price });
  } catch (e) {
    console.error("[appcnpay-pix] error", e);
    return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 500);
  }
});
