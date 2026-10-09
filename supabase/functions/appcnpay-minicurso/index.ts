import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const PRODUCT = { id: "minicurso", name: "Minicurso PDF + desafios", price: 14.99 };

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
    const body = await req.json().catch(() => ({}));
    let email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    let userId: string | null = null;

    const auth = req.headers.get("Authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data } = await userClient.auth.getUser();
      if (data?.user?.email) { userId = data.user.id; email = data.user.email.toLowerCase(); }
    }

    const { name, phone, document } = body;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return json({ error: "Informe um e-mail válido." }, 400);
    if (!name || String(name).trim().length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (!validCPF(String(document ?? ""))) return json({ error: "CPF inválido." }, 400);

    const publicKey = Deno.env.get("APPCNPAY_MINICURSO_PUBLIC_KEY");
    const secretKey = Deno.env.get("APPCNPAY_MINICURSO_PRIVATE_KEY");
    const offerId = Deno.env.get(`APPCNPAY_MINICURSO_OFFER_ID`);
    if (!publicKey || !secretKey || !offerId) {
      console.error("[appcnpay-minicurso] missing credentials");
      return json({ error: "Pagamento temporariamente indisponível." }, 503);
    }

    const identifier = `minicurso_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insertError } = await admin.from("purchases").insert({
      user_id: userId, email, product: PRODUCT.id, status: "pending", amount: PRODUCT.price, external_reference: identifier,
    });
    if (insertError) {
      console.error("[appcnpay-minicurso] failed to create purchase", insertError);
      return json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 500);
    }

    const r = await fetch("https://painel.appcnpay.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        identifier,
        amount: PRODUCT.price,
        offerId,
        client: { name: String(name).trim(), email, phone: String(phone ?? ""), document: String(document) },
        products: [{ id: PRODUCT.id, name: PRODUCT.name, quantity: 1, offerId, price: PRODUCT.price }],
        metadata: { provider: "ImportaFacil", orderId: identifier, product: "minicurso" },
        callbackUrl: `${url}/functions/v1/appcnpay-webhook`,
      }),
    });
    const data = await r.json().catch(() => ({}));
    console.log("[appcnpay-minicurso] status", r.status, "tx", data?.transactionId, "st", data?.status);
    const transactionId = data?.transactionId ?? data?.id ?? null;
    if (!r.ok || !data?.pix?.code) {
      await admin.from("purchases").update({ status: "failed" }).eq("external_reference", identifier);
      return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 502);
    }
    await admin.from("purchases").update({ mercadopago_id: transactionId ? String(transactionId) : null }).eq("external_reference", identifier);

    return json({ identifier, transactionId, code: data.pix.code, image: data.pix.image ?? null, expiresAt: data.pix.expiresAt ?? null, amount: PRODUCT.price });
  } catch (e) {
    console.error("[appcnpay-minicurso] error", e);
    return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 500);
  }
});
