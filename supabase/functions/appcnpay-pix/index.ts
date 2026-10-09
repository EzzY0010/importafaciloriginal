import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanConfig = { name: string; price: number; publicKey: string; privateKey: string };

const PLAN_ENV: Record<string, { name: string; price: number; publicKey: string; privateKey: string }> = {
  mensal: {
    name: "Mentoria (plano mensal)",
    price: 97,
    publicKey: "APPCNPAY_MENSAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_MENSAL_PRIVATE_KEY",
  },
  trimestral: {
    name: "Mentoria (plano trimestral)",
    price: 239,
    publicKey: "APPCNPAY_TRIMESTRAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_TRIMESTRAL_PRIVATE_KEY",
  },
  anual: {
    name: "Mentoria (plano anual)",
    price: 499,
    publicKey: "APPCNPAY_ANUAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_ANUAL_PRIVATE_KEY",
  },
  autonomo: {
    name: "Acesso ao Site + grupo (plano mensal)",
    price: 34.99,
    publicKey: "APPCNPAY_AUTONOMO_PUBLIC_KEY",
    privateKey: "APPCNPAY_AUTONOMO_PRIVATE_KEY",
  },
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
    const plan = PLAN_ENV[String(planId)] as PlanConfig | undefined;
    if (!plan) return json({ error: "Plano inválido." }, 400);
    if (!name || String(name).trim().length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (!validCPF(String(document ?? ""))) return json({ error: "CPF inválido." }, 400);

    const publicKey = Deno.env.get(plan.publicKey);
    const privateKey = Deno.env.get(plan.privateKey);
    if (!publicKey || !privateKey) {
      console.error("[appcnpay-pix] missing credentials", { planId, publicKey: plan.publicKey, privateKey: plan.privateKey });
      return json({ error: "As chaves CN Pay desta oferta ainda não foram configuradas." }, 503);
    }

    const identifier = `${user.id}_${planId}_${Date.now()}`;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: insertError } = await admin.from("payments").insert({
      user_id: user.id,
      amount: plan.price,
      external_reference: identifier,
      status: "pending",
      payment_method: "pix",
    });
    if (insertError) {
      console.error("[appcnpay-pix] failed to create local payment", insertError);
      return json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 500);
    }

    const payload = {
      identifier,
      amount: plan.price,
      client: { name: String(name).trim(), email: user.email, phone: String(phone ?? ""), document: String(document) },
      products: [{ id: planId, name: plan.name, quantity: 1, price: plan.price }],
      metadata: { provider: "ImportaFacil", orderId: identifier, planId },
      callbackUrl: `${url}/functions/v1/appcnpay-webhook`,
    };

    const r = await fetch("https://painel.appcnpay.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-public-key": publicKey, "x-secret-key": privateKey },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    console.log("[appcnpay-pix] status", r.status, "plan", planId, "tx", data?.transactionId, "st", data?.status);
    const transactionId = data?.transactionId ?? data?.id ?? data?.transaction?.id ?? null;
    if (!r.ok || !data?.pix?.code) {
      await admin.from("payments").update({ status: "failed" }).eq("external_reference", identifier);
      return json({ error: "Não foi possível gerar o Pix, tente novamente.", detail: data?.message ?? data?.errorDescription }, 502);
    }

    const { error: updateError } = await admin.from("payments").update({
      mercadopago_id: transactionId,
      preference_id: data.webhookToken ?? data.token ?? null,
    }).eq("external_reference", identifier);
    if (updateError) console.error("[appcnpay-pix] failed to attach provider transaction", updateError);

    return json({ identifier, transactionId, planId, code: data.pix.code, image: data.pix.image ?? null, expiresAt: data.pix.expiresAt ?? null, amount: plan.price });
  } catch (e) {
    console.error("[appcnpay-pix] error", e);
    return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 500);
  }
});
