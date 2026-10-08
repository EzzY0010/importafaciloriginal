import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Plan = { price: number; title: string };

const PLAN_PRICES: Record<string, Plan> = {
  autonomo: { price: 34.99, title: "ImportaFácil - Acesso ao Site" },
  mensal: { price: 97, title: "ImportaFácil - Mentoria Mensal" },
  trimestral: { price: 239, title: "ImportaFácil - Mentoria Trimestral" },
  anual: { price: 499, title: "ImportaFácil - Mentoria Anual" },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let planId = "anual";
    try {
      const body = await req.json();
      if (typeof body?.planId === "string" && PLAN_PRICES[body.planId]) planId = body.planId;
    } catch {
      // A ausência de body usa o plano anual por compatibilidade.
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const authorization = req.headers.get("Authorization");

    if (!authorization || !anonKey || !serviceRoleKey || !accessToken) {
      console.error("Mercado Pago configuration/authentication is incomplete");
      return json({ error: "Payment configuration error" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user?.id || !user.email) {
      console.error("Auth error while creating Mercado Pago preference:", authError);
      return json({ error: "Unauthorized" }, 401);
    }

    const plan = PLAN_PRICES[planId];
    const externalReference = `${user.id}_${planId}_${Date.now()}`;
    const origin = req.headers.get("origin") || "https://importafaciloriginal.lovable.app";
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await adminClient.from("payments").insert({
      user_id: user.id,
      external_reference: externalReference,
      amount: plan.price,
      status: "pending",
      payment_method: "mercadopago",
    });

    if (insertError) {
      console.error("Could not create local payment record:", insertError);
      return json({ error: "Could not register payment" }, 500);
    }

    const preferenceData = {
      items: [{
        id: `importafacil-${planId}`,
        title: plan.title,
        description: "Acesso ao ImportaFácil com IA e ferramentas de importação",
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.price,
      }],
      payer: { email: user.email },
      back_urls: {
        success: `${origin}/dashboard?payment=success`,
        failure: `${origin}/dashboard?payment=failure`,
        pending: `${origin}/dashboard?payment=pending`,
      },
      auto_return: "approved",
      external_reference: externalReference,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "IMPORTAFACIL",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });
    const mpData = await mpResponse.json();

    if (!mpResponse.ok || !mpData?.id || !mpData?.init_point) {
      console.error("Mercado Pago preference error:", mpResponse.status, mpData);
      await adminClient.from("payments").update({ status: "failed" }).eq("external_reference", externalReference);
      return json({ error: "Failed to create payment" }, 502);
    }

    const { error: preferenceError } = await adminClient
      .from("payments")
      .update({ preference_id: String(mpData.id) })
      .eq("external_reference", externalReference);

    if (preferenceError) {
      console.error("Could not link Mercado Pago preference:", preferenceError);
      await adminClient.from("payments").update({ status: "failed" }).eq("external_reference", externalReference);
      return json({ error: "Could not register payment" }, 500);
    }

    return json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point ?? null,
      preference_id: String(mpData.id),
    });
  } catch (error) {
    console.error("Mercado Pago preference error:", error);
    return json({ error: "Unexpected payment error" }, 500);
  }
});
