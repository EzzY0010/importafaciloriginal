const CN_PAY_CHECKOUT_BASE =
  "https://checkout.appcnpay.com/checkout/cmvfiom8h0qm101q13grwphkh?offer=";

// Códigos conferidos no painel CN Pay do produto "Spotify indiv. mensal".
export const SPOTIFY_OFFER_IDS = {
  month: "IXI6L7V",
  quarter: "19V3ZDU",
  year: "NINH4BT",
} as const;

export type SpotifyPlanId = keyof typeof SPOTIFY_OFFER_IDS;

export const getSpotifyCheckoutUrl = (planId: SpotifyPlanId) =>
  `${CN_PAY_CHECKOUT_BASE}${encodeURIComponent(SPOTIFY_OFFER_IDS[planId])}&lang=pt-BR`;
