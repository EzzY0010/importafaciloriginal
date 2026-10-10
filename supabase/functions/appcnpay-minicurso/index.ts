import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const PRODUCT = {
  id: "minicurso",
  name: "Minicurso PDF + desafios",
  price: 14.99,
  publicKey: "APPCNPAY_MINICURSO_PUBLIC_KEY",
  privateKey: "APPCNPAY_MINICURSO_PRIVATE_KEY",
  offerId: "APPCNPAY_MINICURSO_OFFER_ID",
};
const MINICURSO_OFFER_ID_FALLBACK = "ELFF7W5";

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRoleKey) return json({ error: "O serviço de pagamento está temporariamente indisponível." }, 503);

    const body = await req.json().catch(() => ({}));
    let email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    let userId: string | null = null;
    const auth = req.headers.get("Authorization") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (anonKey && auth.startsWith("Bearer ")) {
      const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
      const { data } = await userClient.auth.getUser();
      if (data?.user?.email) {
        userId = data.user.id;
        email = data.user.email.toLowerCase();
      }
    }

    const { name, phone, document } = body;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) return json({ error: "Informe um e-mail válido." }, 400);
    if (!name || String(name).trim().length < 3) return json({ error: "Informe seu nome completo." }, 400);
    if (!validCPF(String(document ?? ""))) return json({ error: "CPF inválido." }, 400);

    const publicKey = Deno.env.get(PRODUCT.publicKey);
    const privateKey = Deno.env.get(PRODUCT.privateKey);
    const offerId = Deno.env.get(PRODUCT.offerId) ?? MINICURSO_OFFER_ID_FALLBACK;
    if (!publicKey || !privateKey || !offerId) {
      console.error("[appcnpay-minicurso] missing offer configuration", {
        publicKey: PRODUCT.publicKey,
        privateKey: PRODUCT.privateKey,
        offerId: PRODUCT.offerId,
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
        hasOfferId: !!offerId,
      });
      return json({ error: "A oferta do minicurso ainda não está configurada. Informe as chaves e o ID da oferta no Cloud Secrets." }, 503);
    }

    const identifier = `minicurso_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const admin = createClient(url, serviceRoleKey);
    const { error: insertError } = await admin.from("purchases").insert({
      user_id: userId,
      email,
      product: PRODUCT.id,
      status: "pending",
      amount: PRODUCT.price,
      external_reference: identifier,
    });
    if (insertError) {
      console.error("[appcnpay-minicurso] failed to create purchase", insertError);
      return json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, 500);
    }

    const response = await fetch("https://painel.appcnpay.com/api/v1/gateway/pix/receive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": publicKey,
        "x-secret-key": privateKey,
      },
      body: JSON.stringify({
        identifier,
        offerId,
        amount: PRODUCT.price,
        client: { name: String(name).trim(), email, phone: String(phone ?? ""), document: String(document) },
        products: [{ id: offerId, offerId, productId: PRODUCT.id, name: PRODUCT.name, quantity: 1, price: PRODUCT.price }],
        metadata: { provider: "ImportaFacil", orderId: identifier, product: PRODUCT.id, offerId },
        callbackUrl: `${url}/functions/v1/appcnpay-webhook`,
      }),
    });
    const data = await response.json().catch(() => ({}));
    console.log("[appcnpay-minicurso] provider response", {
      status: response.status,
      offerId,
      transactionId: data?.transactionId ?? data?.id,
      providerStatus: data?.status,
    });

    const transactionId = data?.transactionId ?? data?.id ?? data?.transaction?.id ?? null;
    const pixCode = data?.pix?.code ?? data?.pixCode ?? data?.qrCode ?? data?.copyPaste ?? null;
    if (!response.ok || !pixCode) {
      await admin.from("purchases").update({ status: "failed" }).eq("external_reference", identifier);
      return json({
        error: "A CN Pay recusou a criação deste Pix. Confira o ID e as chaves da oferta.",
        detail: data?.message ?? data?.error ?? data?.errorDescription ?? `HTTP ${response.status}`,
      }, 502);
    }

    await admin.from("purchases").update({ mercadopago_id: transactionId ? String(transactionId) : null }).eq("external_reference", identifier);
    return json({
      identifier,
      transactionId,
      offerId,
      code: pixCode,
      image: data?.pix?.image ?? data?.qrCodeImage ?? null,
      expiresAt: data?.pix?.expiresAt ?? data?.expiresAt ?? null,
      amount: PRODUCT.price,
    });
  } catch (error) {
    console.error("[appcnpay-minicurso] error", error);
    return json({ error: "Não foi possível gerar o Pix, tente novamente." }, 500);
  }
});
