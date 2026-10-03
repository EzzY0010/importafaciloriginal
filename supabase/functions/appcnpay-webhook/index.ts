import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fixed callback URL for every AppCNPay Pix transaction.
const DAYS: Record<string, number> = { mensal: 30, trimestral: 90, anual: 365 };
const PAID = ["COMPLETED", "PAID", "APPROVED", "CONFIRMED"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");
  try {
    const body: any = await req.json().catch(() => ({}));
    const tx = body.transaction ?? body.data ?? body;
    const transactionId = tx.id ?? tx.transactionId ?? body.transactionId;
    const identifier = tx.identifier ?? body.identifier;
    const status = String(tx.status ?? tx.transactionStatus ?? body.status ?? body.event ?? "").toUpperCase();
    const token = body.token ?? body.webhookToken ?? req.headers.get("x-webhook-token");
    console.log("[appcnpay-webhook]", { transactionId, identifier, status, hasToken: !!token });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let q = admin.from("payments").select("*").eq("payment_method", "pix").limit(1);
    q = identifier ? q.eq("external_reference", identifier) : q.eq("mercadopago_id", transactionId ?? "-");
    const { data: rows } = await q;
    const pay = rows?.[0];
    if (!pay) { console.warn("[appcnpay-webhook] pagamento não encontrado"); return new Response("OK"); }
    if (pay.preference_id && token && token !== pay.preference_id) {
      console.warn("[appcnpay-webhook] token inválido"); return new Response("Forbidden", { status: 403 });
    }
    if (!PAID.some((s) => status.includes(s))) return new Response("OK");
    if (pay.status === "approved") return new Response("OK");

    await admin.from("payments").update({ status: "approved" }).eq("id", pay.id);
    const planId = pay.external_reference.split("_")[1] ?? "mensal";
    const expires = new Date(Date.now() + (DAYS[planId] ?? 30) * 864e5).toISOString();
    const { error } = await admin.from("profiles").update({ has_paid: true, plan_type: planId, plan_expires_at: expires }).eq("id", pay.user_id);
    console.log("[appcnpay-webhook] acesso liberado", pay.user_id, planId, error ?? "");
    return new Response("OK");
  } catch (e) {
    console.error("[appcnpay-webhook] error", e);
    return new Response("Error", { status: 500 });
  }
});
