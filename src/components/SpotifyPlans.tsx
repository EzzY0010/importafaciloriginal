import { ArrowRight, BadgeCheck, Check, Music2, ShieldCheck } from "lucide-react";
import { getSpotifyCheckoutUrl, type SpotifyPlanId } from "@/config/spotifyCheckouts";

type Plan = {
  id: SpotifyPlanId;
  title: string;
  regularPrice: string;
  price: string;
  action: string;
  badge?: string;
  featured?: boolean;
  benefits: string[];
};

const plans: Plan[] = [
  {
    id: "month",
    title: "Spotify Individual - 1 Mês",
    regularPrice: "R$ 23,90",
    price: "R$ 14,90",
    action: "Comprar 1 Mês",
    benefits: ["🚫 Zero anúncios", "⬇️ Download offline", "🎧 Qualidade máxima", "🛡️ Garantia de 30 dias"],
  },
  {
    id: "quarter",
    title: "Spotify Individual - 3 Meses",
    regularPrice: "R$ 72,00",
    price: "R$ 39,90",
    action: "Comprar 3 Meses",
    badge: "Mais Popular",
    featured: true,
    benefits: ["🚫 Zero anúncios", "⬇️ Download offline", "💰 Economia de mais de R$ 30", "🛡️ Garantia de 90 dias"],
  },
  {
    id: "year",
    title: "Spotify Individual - 1 Ano",
    regularPrice: "R$ 239,00",
    price: "R$ 89,90",
    action: "Comprar Plano Anual",
    badge: "Maior Economia",
    benefits: ["🚫 Zero anúncios o ano todo", "⬇️ Download offline", "⚡ Sai R$ 7,49/mês", "🛡️ Garantia de 12 meses"],
  },
];

const SpotifyPlans = () => (
  <section id="spotify-premium" className="relative z-10 scroll-mt-24 bg-[#07110d] px-5 py-20 text-white sm:px-6 sm:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1ed760]/25 bg-[#1ed760]/10 px-3 py-1.5 text-xs font-semibold text-[#1ed760]">
          <Music2 className="h-4 w-4" aria-hidden="true" /> Spotify Premium
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Curta sua música <span className="text-[#1ed760]">sem limites</span></h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">Escolha o período ideal e aproveite sua experiência Premium.</p>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const checkoutUrl = getSpotifyCheckoutUrl(plan.id);
          return (
            <article
              key={plan.id}
              className={`relative flex h-full flex-col rounded-3xl border p-6 transition-transform duration-200 hover:-translate-y-1 ${
                plan.featured
                  ? "border-[#1ed760]/70 bg-gradient-to-b from-[#12351f] to-[#0c1710] shadow-[0_16px_55px_-24px_rgba(30,215,96,.55)] md:scale-[1.03]"
                  : "border-white/10 bg-white/[0.035] hover:border-[#1ed760]/40"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1ed760] px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#06210f] shadow-lg">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1ed760]/15 text-[#1ed760]">
                  <Music2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold leading-snug sm:text-lg">{plan.title}</h3>
              </div>
              <div className="mb-6 border-b border-white/10 pb-5">
                <p className="text-sm text-white/45 line-through">{plan.regularPrice}</p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-white">{plan.price}</p>
                <p className="mt-1 text-xs text-white/50">pagamento único</p>
              </div>
              <ul className="mb-7 flex-1 space-y-3.5">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1ed760]" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  className={`inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${
                    plan.featured ? "bg-[#1ed760] text-[#06210f] hover:bg-[#35e978]" : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                  aria-label={`${plan.action} — ${plan.title}`}
                >
                  {plan.action}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-bold text-white/45"
                  title="Configure o ID da oferta Spotify em src/config/spotifyCheckouts.ts"
                >
                  {plan.action}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/45">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1ed760]" aria-hidden="true" /> Pagamento processado pela CN Pay
              </p>
            </article>
          );
        })}
      </div>
      <p className="mx-auto mt-7 flex max-w-3xl items-center justify-center gap-2 text-center text-xs text-white/45">
        <BadgeCheck className="h-4 w-4 shrink-0 text-[#1ed760]" aria-hidden="true" />
        Seus dados de pagamento são tratados diretamente no checkout da CN Pay.
      </p>
    </div>
  </section>
);

export default SpotifyPlans;
