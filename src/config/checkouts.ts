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

export const getPlanCheckoutUrl = (planId: PlanId) => CN_PAY_CHECKOUTS[planId];
