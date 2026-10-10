import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanConfig = {
  name: string;
  price: number;
  publicKey: string;
  privateKey: string;
  offerId: string;
};

const PLAN_ENV: Record<string, PlanConfig> = {
  mensal: {
    name: "Mentoria (plano mensal)",
    price: 97,
    publicKey: "APPCNPAY_MENSAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_MENSAL_PRIVATE_KEY",
    offerId: "APPCNPAY_MENSAL_OFFER_ID",
  },
  trimestral: {
    name: "Mentoria (plano trimestral)",
    price: 239,
    publicKey: "APPCNPAY_TRIMESTRAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_TRIMESTRAL_PRIVATE_KEY",
    offerId: "APPCNPAY_TRIMESTRAL_OFFER_ID",
  },
  anual: {
    name: "Mentoria (plano anual)",
    price: 499,
    publicKey: "APPCNPAY_ANUAL_PUBLIC_KEY",
    privateKey: "APPCNPAY_ANUAL_PRIVATE_KEY",
    offerId: "APPCNPAY_ANUAL_OFFER_ID",
  },
  autonomo: {
    name: "Acesso ao Site + grupo (plano mensal)",
    price: 34.99,
    publicKey: "APPCNPAY_SITE_GRUPO_PUBLIC_KEY",
    privateKey: "APPCNPAY_SITE_GRUPO_PRIVATE_KEY",
    offerId: "APPCNPAY_SITE_GRUPO_OFFER_ID",
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const validCPF = (raw: string) => {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(cpf[length])) return false;
  }
  return true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceRoleKey) {
      console.error("[appcnpay-pix] Supabase secrets are incomplete");
      return json({ error: "O serviço de pagamento está temporariamente indisponível." }, 503);
    }

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return json({ error: "Faça login para gerar o Pix." }, 401);

    const body = await req.json().catch(() => ({}));
    const { planId, name, phone, document } = body;
    const plan = PLAN_ENV[String(planId)] as PlanConfig | undefined;
    if (!plan) return json({ error: "Plano inválido." }, 400);
    if (!name || String(name).trim().length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (!validCPF(String(document ?? ""))) return json({ error: "CPF inválido." }, 400);

    const publicKey = Deno.env.get(plan.publicKey);
    const privateKey = Deno.env.get(plan.privateKey);
    const offerId = Deno.env.get(plan.offerId);
    if (!publicKey || !privateKey || !offerId) {
      console.error("[appcnpay-pix] missing offer configuration", {
        planId,
        publicKey: plan.publicKey,
        privateKey: plan.privateKey,
        offerId: plan.offerId,
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
        hasOfferId: !!offerId,
      });
      return json({ error: "A oferta deste plano ainda não está configurada. Informe as chaves e o ID da oferta no Cloud Secrets." }, 503);
    }

    const identifier = `${user.id}_${planId}_${Date.now()}`;
    const admin = createClient(url, serviceRoleKey);
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
      offerId,
      amount: plan.price,
      client: {
        name: String(name).trim(),
        email: user.email,
        phone: String(phone ?? ""),
        document: String(document),
      },
      products: [{ id: offerId, offerId, planId, name: plan.name, quantity: 1, price: plan.price }],
      metadata: { provider: "ImportaFacil", orderId: identifier, planId, offerId },
      callbackUrl: `${url}/functions/v1/appcnpay-webhook`,
    };

    const response = await fetch("https://painel.appcnpay.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": privateKey,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    console.log("[appcnpay-pix] provider response", {
      status: response.status,
      planId,
      offerId,
      transactionId: data?.transactionId ?? data?.id,
      providerStatus: data?.status,
    });

    const transactionId = data?.transactionId ?? data?.id ?? data?.transaction?.id ?? null;
    const pixCode = data?.pix?.code ?? data?.pixCode ?? data?.qrCode ?? data?.copyPaste ?? null;
    if (!response.ok || !pixCode) {
      await admin.from("payments").update({ status: "failed" }).eq("external_reference", identifier);
      console.error("[appcnpay-pix] provider rejected Pix", {
        status: response.status,
        providerMessage: data?.message ?? data?.error ?? data?.errorDescription,
      });
      return json({
        error: "A CN Pay recusou a criação deste Pix. Confira o ID e as chaves da oferta.",
        detail: data?.message ?? data?.error ?? data?.errorDescription ?? `HTTP ${response.status}`,
      }, 502);
    }

    const { error: updateError } = await admin.from("payments").update({
      mercadopago_id: transactionId,
      preference_id: data.webhookToken ?? data.token ?? null,
    }).eq("external_reference", identifier);
    if (updateError) console.error("[appcnpay-pix] failed to attach provider transaction", updateError);

    return json({
      identifier,
      transactionId,
      planId,
      offerId,
      code: pixCode,
      image: data?.pix?.image ?? data?.qrCodeImage ?? null,
      expiresAt: data?.pix?.expiresAt ?? data?.expiresAt ?? null,
      amount: plan.price,
    });
  } catch (error) {
    console.error("[appcnpay-pix] error", error);
    return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 500);
  }
});
