import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fixed callback URL for every AppCNPay Pix transaction.
const DAYS: Record<string, number> = { mensal: 30, trimestral: 90, anual: 365, autonomo: 30 };
const PAID = ["COMPLETED", "PAID", "APPROVED", "CONFIRMED"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");
  try {
    const body: any = await req.json().catch(() => ({}));
    const tx = body.transaction ?? body.data ?? body;
    const transactionId = tx.id ?? tx.transactionId ?? body.transactionId ?? body.id;
    const identifier = tx.identifier
      ?? body.identifier
      ?? tx.orderId
      ?? body.orderId
      ?? tx.external_reference
      ?? body.external_reference
      ?? tx.metadata?.orderId
      ?? body.metadata?.orderId;
    const status = String(tx.status ?? tx.transactionStatus ?? body.status ?? body.event ?? "").toUpperCase();
    const token = body.token ?? body.webhookToken ?? req.headers.get("x-webhook-token");
    console.log("[appcnpay-webhook]", { transactionId, identifier, status, hasToken: !!token });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let pay: any = null;
    if (identifier) {
      const { data } = await admin.from("payments").select("*")
        .eq("payment_method", "pix").eq("external_reference", String(identifier)).maybeSingle();
      pay = data;
    }
    if (!pay && transactionId) {
      const { data } = await admin.from("payments").select("*")
        .eq("payment_method", "pix").eq("mercadopago_id", String(transactionId)).maybeSingle();
      pay = data;
    }
    if (!pay) { console.warn("[appcnpay-webhook] pagamento não encontrado"); return new Response("OK"); }
    if (pay.preference_id && token && token !== pay.preference_id) {
      console.warn("[appcnpay-webhook] token inválido"); return new Response("Forbidden", { status: 403 });
    }
    if (!PAID.some((s) => status.includes(s))) return new Response("OK");
    if (pay.status === "approved") return new Response("OK");

    const planId = pay.external_reference.split("_")[1] ?? "mensal";
    const { data: cur } = await admin.from("profiles").select("plan_expires_at, legacy_access").eq("id", pay.user_id).maybeSingle();
    const base = Math.max(Date.now(), cur?.plan_expires_at ? new Date(cur.plan_expires_at).getTime() : 0);
    const expires = new Date(base + (DAYS[planId] ?? 30) * 864e5).toISOString();
    const { error: profileError } = await admin.from("profiles").update({
      has_paid: true,
      plan_type: planId,
      plan_expires_at: cur?.legacy_access ? null : expires,
    }).eq("id", pay.user_id);
    if (profileError) {
      console.error("[appcnpay-webhook] profile update failed; returning 500 for provider retry", profileError);
      return new Response("Profile update failed", { status: 500 });
    }
    const { error: paymentError } = await admin.from("payments").update({
      status: "approved",
      mercadopago_id: transactionId ? String(transactionId) : pay.mercadopago_id,
    }).eq("id", pay.id);
    if (paymentError) {
      console.error("[appcnpay-webhook] payment update failed", paymentError);
      return new Response("Payment update failed", { status: 500 });
    }
    console.log("[appcnpay-webhook] acesso liberado", pay.user_id, planId);
    return new Response("OK");
  } catch (e) {
    console.error("[appcnpay-webhook] error", e);
    return new Response("Error", { status: 500 });
  }
});
