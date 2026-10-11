import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAYS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  anual: 365,
  autonomo: 30,
};

const PAID_WORDS = ["COMPLETED", "PAID", "APPROVED", "CONFIRMED", "SUCCEEDED", "SUCCESS", "SETTLED"];
const OFFER_TO_PLAN: Record<string, string> = {
  // IDs atuais e IDs usados nos links hospedados anteriormente.
  JX5U4XC: "mensal",
  "5I0EBB2": "trimestral",
  "76GLDI7": "anual",
  TVDJKRN: "autonomo",
  "038EXW7": "mensal",
  "2J657HL": "trimestral",
  "1DUNPV5": "anual",
  QN950TS: "autonomo",
};
const AMOUNT_TO_PLAN: Record<string, string> = {
  "14.99": "minicurso",
  "34.99": "autonomo",
  "97": "mensal",
  "239": "trimestral",
  "499": "anual",
};
const norm = (value: unknown) => (value === undefined || value === null ? "" : String(value).trim());

const asObjects = (body: any) => {
  const objects: any[] = [];
  const visit = (value: any, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 4 || objects.includes(value)) return;
    objects.push(value);
    for (const child of Object.values(value)) visit(child, depth + 1);
  };
  visit(body);
  return objects;
};

const firstValue = (objects: any[], keys: string[]) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];
      if (value !== undefined && value !== null && norm(value) !== "") return value;
    }
  }
  return "";
};

const firstEmail = (objects: any[]) => {
  for (const object of objects) {
    for (const key of ["email", "payerEmail", "customerEmail", "buyerEmail"]) {
      const value = norm(object?.[key]).toLowerCase();
      if (value.includes("@")) return value;
    }
  }
  return "";
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("OK");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[appcnpay-webhook] Supabase service configuration is incomplete");
      return new Response("Error", { status: 500 });
    }

    const body: any = await req.json().catch(() => ({}));
    const objects = asObjects(body);
    const transactionId = norm(firstValue(objects, [
      "transactionId", "transaction_id", "paymentId", "payment_id", "chargeId", "charge_id", "id",
    ]));
    const identifier = norm(firstValue(objects, [
      "identifier", "orderId", "order_id", "external_reference", "externalReference", "reference", "orderReference",
    ]));
    const offerId = norm(firstValue(objects, [
      "offerId", "offer_id", "offer", "offerCode", "offer_code", "productId", "product_id", "productCode", "product_code",
    ]));
    const email = firstEmail(objects);
    const statusValues = objects.flatMap((object) => [
      object?.status,
      object?.transactionStatus,
      object?.transaction_status,
      object?.paymentStatus,
      object?.payment_status,
      object?.state,
      object?.event,
      object?.eventType,
      object?.type,
    ]).map(norm).filter(Boolean);
    const isPaid = statusValues.some((status) => PAID_WORDS.some((word) => status.toUpperCase().includes(word)))
      || objects.some((object) => object?.paid === true || object?.confirmed === true || object?.isPaid === true);
    const providerAmountRaw = firstValue(objects, ["amount", "value", "paidAmount", "paid_amount", "total"]);
    const providerAmount = Number(providerAmountRaw);

    // Alguns callbacks colocam os dados de pedido somente dentro de metadata/customData.
    const metadata = objects.find((object) => object?.orderId || object?.external_reference || object?.identifier || object?.email);
    const resolvedIdentifier = identifier || norm(metadata?.orderId ?? metadata?.external_reference ?? metadata?.identifier);
    const resolvedEmail = email || norm(metadata?.email).toLowerCase();
    const token = norm(body.token ?? body.webhookToken ?? req.headers.get("x-webhook-token"));

    console.log("[appcnpay-webhook] recebido", {
      transactionId,
      identifier: resolvedIdentifier,
      offerId,
      email: resolvedEmail ? "present" : "missing",
      status: statusValues.slice(0, 5),
      isPaid,
      hasToken: !!token,
    });

    // Nunca libera uma cobrança que não foi marcada como paga pela CN Pay.
    if (!isPaid) return new Response("OK");

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // ---- Minicurso ----
    let purchase: any = null;
    if (resolvedIdentifier) {
      const { data } = await admin.from("purchases")
        .select("*")
        .eq("external_reference", resolvedIdentifier)
        .maybeSingle();
      purchase = data;
    }
    if (!purchase && transactionId) {
      const { data } = await admin.from("purchases")
        .select("*")
        .eq("product", "minicurso")
        .eq("mercadopago_id", transactionId)
        .maybeSingle();
      purchase = data;
    }
    if (!purchase && resolvedEmail) {
      const { data } = await admin.from("purchases")
        .select("*")
        .eq("product", "minicurso")
        .ilike("email", resolvedEmail)
        .neq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      purchase = data;
    }

    if (purchase) {
      if (Number.isFinite(providerAmount) && providerAmount > 0 && Math.abs(providerAmount - Number(purchase.amount)) > 0.01) {
        console.error("[appcnpay-webhook] minicurso amount mismatch", { expected: purchase.amount, received: providerAmount });
        return new Response("Forbidden", { status: 403 });
      }
      if (purchase.status === "approved") return new Response("OK");

      let userId = purchase.user_id;
      if (!userId) {
        const { data: profile } = await admin.from("profiles").select("id").ilike("email", purchase.email).maybeSingle();
        userId = profile?.id ?? null;
      }
      const { error: purchaseError } = await admin.from("purchases").update({
        status: "approved",
        user_id: userId,
        mercadopago_id: transactionId || purchase.mercadopago_id,
      }).eq("id", purchase.id);
      if (purchaseError) {
        console.error("[appcnpay-webhook] purchase update failed", purchaseError);
        return new Response("Error", { status: 500 });
      }
      if (userId) {
        const { error: profileError } = await admin.from("profiles").update({ has_minicourse: true }).eq("id", userId);
        if (profileError) {
          console.error("[appcnpay-webhook] minicurso profile update failed", profileError);
          return new Response("Error", { status: 500 });
        }
      }
      console.log("[appcnpay-webhook] minicurso liberado", purchase.id, userId ?? "sem-conta");
      return new Response("OK");
    }

    // ---- Planos ----
    let payment: any = null;
    if (resolvedIdentifier) {
      const { data } = await admin.from("payments")
        .select("*")
        .eq("payment_method", "pix")
        .eq("external_reference", resolvedIdentifier)
        .maybeSingle();
      payment = data;
    }
    if (!payment && transactionId) {
      const { data } = await admin.from("payments")
        .select("*")
        .eq("payment_method", "pix")
        .eq("mercadopago_id", transactionId)
        .maybeSingle();
      payment = data;
    }
    let matchedProfileId: string | null = null;
    if (!payment && resolvedEmail) {
      const { data: profile } = await admin.from("profiles").select("id").ilike("email", resolvedEmail).maybeSingle();
      if (profile?.id) {
        matchedProfileId = profile.id;
        const { data } = await admin.from("payments")
          .select("*")
          .eq("payment_method", "pix")
          .eq("user_id", profile.id)
          .neq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        payment = data;
      }
    }

    if (!payment) {
      if (!resolvedEmail) {
        console.warn("[appcnpay-webhook] pagamento não encontrado e callback sem e-mail", { transactionId, identifier: resolvedIdentifier });
        return new Response("OK");
      }

      // Checkout hospedado: o cliente pode pagar antes de criar a conta.
      // Guardamos a aprovação por e-mail para o trigger da migration vinculá-la no cadastro.
      const reference = resolvedIdentifier || `cnpy_${transactionId || crypto.randomUUID()}`;
      const planFromReference = String(reference).split("_").find((part) => DAYS[part]);
      const planId = planFromReference || OFFER_TO_PLAN[offerId] || AMOUNT_TO_PLAN[providerAmount.toFixed(2)] || "mensal";
      const { error: claimError } = await admin.from("payments").upsert({
        user_id: matchedProfileId,
        customer_email: resolvedEmail,
        external_reference: reference,
        status: "approved",
        amount: Number.isFinite(providerAmount) && providerAmount > 0 ? providerAmount : 0,
        payment_method: "pix",
        mercadopago_id: transactionId || null,
        plan_type: planId,
      }, { onConflict: "external_reference" });
      if (claimError) {
        console.error("[appcnpay-webhook] failed to store payment claim", claimError);
        return new Response("Error", { status: 500 });
      }

      if (matchedProfileId) {
        const { data: currentProfile } = await admin.from("profiles")
          .select("plan_expires_at, legacy_access")
          .eq("id", matchedProfileId)
          .maybeSingle();
        const expiresAt = new Date(Date.now() + DAYS[planId] * 864e5).toISOString();
        const { error: profileError } = await admin.from("profiles").update({
          has_paid: true,
          plan_type: planId,
          plan_expires_at: currentProfile?.legacy_access ? null : expiresAt,
        }).eq("id", matchedProfileId);
        if (profileError) {
          console.error("[appcnpay-webhook] claimed profile update failed", profileError);
          return new Response("Error", { status: 500 });
        }
      }
      console.log("[appcnpay-webhook] aprovação guardada por e-mail", { email: "present", planId, transactionId });
      return new Response("OK");
    }
    if (Number.isFinite(providerAmount) && providerAmount > 0 && Math.abs(providerAmount - Number(payment.amount)) > 0.01) {
      console.error("[appcnpay-webhook] plan amount mismatch", { expected: payment.amount, received: providerAmount });
      return new Response("Forbidden", { status: 403 });
    }
    if (payment.status === "approved") return new Response("OK");

    const parts = String(payment.external_reference ?? "").split("_");
    const planId = (DAYS[parts[1]] ? parts[1] : payment.plan_type) || OFFER_TO_PLAN[offerId] || "mensal";
    if (!payment.user_id) {
      if (!matchedProfileId && (resolvedEmail || payment.customer_email)) {
        const { data: profile } = await admin.from("profiles")
          .select("id")
          .ilike("email", resolvedEmail || payment.customer_email)
          .maybeSingle();
        matchedProfileId = profile?.id ?? null;
      }
      if (matchedProfileId) {
        const { data: currentProfile } = await admin.from("profiles")
          .select("plan_expires_at, legacy_access")
          .eq("id", matchedProfileId)
          .maybeSingle();
        const expiresAt = new Date(Date.now() + DAYS[planId] * 864e5).toISOString();
        const { error: profileError } = await admin.from("profiles").update({
          has_paid: true,
          plan_type: planId,
          plan_expires_at: currentProfile?.legacy_access ? null : expiresAt,
        }).eq("id", matchedProfileId);
        if (profileError) {
          console.error("[appcnpay-webhook] profile claim update failed", profileError);
          return new Response("Error", { status: 500 });
        }
      }
      const { error: claimError } = await admin.from("payments").update({
        status: "approved",
        user_id: matchedProfileId,
        customer_email: resolvedEmail || payment.customer_email,
        plan_type: planId,
        mercadopago_id: transactionId || payment.mercadopago_id,
      }).eq("id", payment.id);
      if (claimError) {
        console.error("[appcnpay-webhook] payment claim update failed", claimError);
        return new Response("Error", { status: 500 });
      }
      return new Response("OK");
    }
    const { data: currentProfile } = await admin.from("profiles")
      .select("plan_expires_at, legacy_access")
      .eq("id", payment.user_id)
      .maybeSingle();
    const base = Math.max(Date.now(), currentProfile?.plan_expires_at ? new Date(currentProfile.plan_expires_at).getTime() : 0);
    const expiresAt = new Date(base + DAYS[planId] * 864e5).toISOString();

    const { error: profileError } = await admin.from("profiles").update({
      has_paid: true,
      plan_type: planId,
      plan_expires_at: currentProfile?.legacy_access ? null : expiresAt,
    }).eq("id", payment.user_id);
    if (profileError) {
      console.error("[appcnpay-webhook] profile update failed", profileError);
      return new Response("Error", { status: 500 });
    }

    const { error: paymentError } = await admin.from("payments").update({
      status: "approved",
      mercadopago_id: transactionId || payment.mercadopago_id,
    }).eq("id", payment.id);
    if (paymentError) {
      console.error("[appcnpay-webhook] payment update failed", paymentError);
      return new Response("Error", { status: 500 });
    }

    console.log("[appcnpay-webhook] acesso liberado", { userId: payment.user_id, planId, paymentId: payment.id });
    return new Response("OK");
  } catch (error) {
    console.error("[appcnpay-webhook] error", error);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
