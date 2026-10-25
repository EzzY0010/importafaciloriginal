import type { PlanId } from "@/config/plans";

const CN_PAY_CHECKOUT_BASE =
  "https://checkout.appcnpay.com/checkout/cmv1ujiwd0khe01q0wotd9gr5?offer=";

export const CN_PAY_CHECKOUTS = {
  minicurso: `${CN_PAY_CHECKOUT_BASE}L6Q9HKG`,
  autonomo: `${CN_PAY_CHECKOUT_BASE}QN950TS`,
  mensal: `${CN_PAY_CHECKOUT_BASE}038EXW7`,
  trimestral: `${CN_PAY_CHECKOUT_BASE}2J657HL`,
  anual: `${CN_PAY_CHECKOUT_BASE}1DUNPV5`,
} as const;

export const BEGINNERS_CHECKOUT_URL =
  "https://checkout.appcnpay.com/checkout/cmvn95huw323z01q0ufu17eng?offer=7UTYRCM";

const SPOTIFY_CHECKOUT_BASE =
  "https://checkout.appcnpay.com/checkout/cmvfiom8h0qm101q13grwphkh?offer=";

export const SPOTIFY_CHECKOUTS = {
  monthly: `${SPOTIFY_CHECKOUT_BASE}IXI6L7V`,
  quarterly: `${SPOTIFY_CHECKOUT_BASE}19V3ZDU`,
  annual: `${SPOTIFY_CHECKOUT_BASE}NINH4BT`,
} as const;

export const getPlanCheckoutUrl = (planId: PlanId) => CN_PAY_CHECKOUTS[planId];

/** O webhook continua sendo a fonte de verdade para liberar acesso. */
export const getPlanCheckoutRedirectUrl = (planId: PlanId) => {
  const checkout = new URL(getPlanCheckoutUrl(planId));
  checkout.searchParams.set(
    "success_url",
    `${window.location.origin}/login?checkout=success&plan=${encodeURIComponent(planId)}`,
  );
  checkout.searchParams.set("cancel_url", `${window.location.origin}/?checkout=cancelled`);
  return checkout.toString();
};
