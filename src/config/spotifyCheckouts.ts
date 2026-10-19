const CN_PAY_CHECKOUT_BASE =
  "https://checkout.appcnpay.com/checkout/cmv1ujiwd0khe01q0wotd9gr5?offer=";

/**
 * Cadastre aqui os IDs de oferta Spotify criados no painel CN Pay.
 * Não reutilize os IDs dos planos ImportaFácil: eles têm valores diferentes.
 */
export const SPOTIFY_OFFER_IDS = {
  month: "", // ID da oferta Spotify Individual - 1 Mês (R$ 14,90)
  quarter: "", // ID da oferta Spotify Individual - 3 Meses (R$ 39,90)
  year: "", // ID da oferta Spotify Individual - 1 Ano (R$ 89,90)
} as const;

export type SpotifyPlanId = keyof typeof SPOTIFY_OFFER_IDS;

export const getSpotifyCheckoutUrl = (planId: SpotifyPlanId) => {
  const offerId = SPOTIFY_OFFER_IDS[planId].trim();
  return offerId ? `${CN_PAY_CHECKOUT_BASE}${encodeURIComponent(offerId)}` : null;
};
