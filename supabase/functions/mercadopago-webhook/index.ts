import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DAYS: Record<string, number> = {
  autonomo: 30,
  mensal: 30,
  trimestral: 90,
  anual: 365,
};
const LEGACY_ACCOUNT_CUTOFF = Date.parse("2026-10-05T00:00:00Z");

const ok = () => new Response("OK", { status: 200, headers: corsHeaders });
const retry = (message: string) => {
  console.error(`[mercadopago-webhook] ${message}`);
  return new Response(message, { status: 500, headers: corsHeaders });
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const queryTopic = url.searchParams.get("topic") || url.searchParams.get("type");
    const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: Record<string, any> = {};
    try {
      const parsed = await req.json();
      if (parsed && typeof parsed === "object") body = parsed;
    } catch {
      // Mercado Pago também envia notificações com body vazio e dados na query.
    }

    const topic = queryTopic || body.type || body.topic || body.action?.split(".")[0];
    const paymentId = queryId || body.data?.id || body.id;

    if (topic && topic !== "payment" && !String(body.action ?? "").startsWith("payment.")) return ok();
    if (!paymentId) return ok();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!supabaseUrl || !serviceRoleKey || !accessToken) return retry("payment configuration is incomplete");

    // A confirmação vem do próprio Mercado Pago: buscar o pagamento evita liberar
    // acesso com um webhook forjado ou com status apenas informado no body.
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpResponse.ok) return retry(`Mercado Pago lookup failed: ${mpResponse.status}`);

    const paymentData = await mpResponse.json();
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const externalReference = String(paymentData.external_reference ?? "");
    const status = String(paymentData.status ?? "pending");

    console.log("[mercadopago-webhook] notification", {
      paymentId: String(paymentId),
      status,
      externalReference,
    });

    if (externalReference.startsWith("minicurso:")) {
      if (status !== "approved") return ok();
      const email = externalReference.split(":")[1]?.trim().toLowerCase() ?? "";
      const { error: purchaseError } = await adminClient
        .from("purchases")
        .update({ status: "approved", mercadopago_id: String(paymentId) })
        .eq("external_reference", externalReference);
      if (purchaseError) return retry(`minicurso purchase update failed: ${purchaseError.message}`);

      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ has_minicourse: true })
        .ilike("email", email);
      if (profileError) return retry(`minicurso profile update failed: ${profileError.message}`);
      return ok();
    }

    let paymentQuery = adminClient
      .from("payments")
      .select("id,user_id,external_reference,amount,status")
      .eq("mercadopago_id", String(paymentId))
      .maybeSingle();

    if (externalReference) {
      paymentQuery = adminClient
        .from("payments")
        .select("id,user_id,external_reference,amount,status")
        .eq("external_reference", externalReference)
        .maybeSingle();
    }

    const { data: localPayment, error: paymentLookupError } = await paymentQuery;
    if (paymentLookupError) return retry(`local payment lookup failed: ${paymentLookupError.message}`);
    if (!localPayment) {
      // ACK unknown payments to avoid an endless provider retry. They cannot unlock
      // anything because there is no locally-created pending record to reconcile.
      console.warn("[mercadopago-webhook] payment has no local pending record", String(paymentId));
      return ok();
    }

    const amount = Number(paymentData.transaction_amount);
    if (status === "approved" && Number.isFinite(amount) && Math.abs(amount - Number(localPayment.amount)) > 0.01) {
      return retry(`amount mismatch for payment ${String(paymentId)}`);
    }

    const { error: paymentUpdateError } = await adminClient
      .from("payments")
      .update({
        status,
        mercadopago_id: String(paymentId),
        payment_method: paymentData.payment_type_id ?? "mercadopago",
      })
      .eq("id", localPayment.id);
    if (paymentUpdateError) return retry(`payment update failed: ${paymentUpdateError.message}`);

    if (status !== "approved") return ok();

    const referenceParts = String(localPayment.external_reference || externalReference).split("_");
    const planId = PLAN_DAYS[referenceParts[1]] ? referenceParts[1] : "mensal";
    const userId = localPayment.user_id;

    const { data: profile, error: profileLookupError } = await adminClient
      .from("profiles")
      .select("plan_expires_at,legacy_access,created_at")
      .eq("id", userId)
      .maybeSingle();
    if (profileLookupError) return retry(`profile lookup failed: ${profileLookupError.message}`);
    if (!profile) return retry(`profile not found for user ${userId}`);

    const isLegacy = profile.legacy_access === true
      || (!!profile.created_at && Date.parse(profile.created_at) < LEGACY_ACCOUNT_CUTOFF);
    const currentExpiry = profile.plan_expires_at ? Date.parse(profile.plan_expires_at) : 0;
    const baseTime = Math.max(Date.now(), Number.isFinite(currentExpiry) ? currentExpiry : 0);
    const expiresAt = isLegacy
      ? null
      : new Date(baseTime + PLAN_DAYS[planId] * 24 * 60 * 60 * 1000).toISOString();

    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({
        has_paid: true,
        plan_type: planId,
        plan_expires_at: expiresAt,
      })
      .eq("id", userId);
    if (profileUpdateError) return retry(`profile update failed: ${profileUpdateError.message}`);

    console.log("[mercadopago-webhook] access released", { userId, planId, isLegacy });
    return ok();
  } catch (error) {
    return retry(error instanceof Error ? error.message : "unexpected webhook error");
  }
});
