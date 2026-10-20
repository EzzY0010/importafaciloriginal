import { Check, CircleDollarSign, Download, Headphones, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPOTIFY_CHECKOUTS } from "@/config/checkouts";

type SpotifyPlan = {
  title: string;
  tablePrice: string;
  price: string;
  checkoutUrl: string;
  cta: string;
  badge?: string;
  features: string[];
  featured?: boolean;
};

const spotifyPlans: SpotifyPlan[] = [
  {
    title: "Spotify Individual - 1 Mês",
    tablePrice: "23,90",
    price: "14,90",
    checkoutUrl: SPOTIFY_CHECKOUTS.monthly,
    cta: "Comprar 1 Mês",
    features: ["Zero anúncios", "Download offline", "Qualidade máxima", "Garantia de 30 dias"],
  },
  {
    title: "Spotify Individual - 3 Meses",
    tablePrice: "72,00",
    price: "39,90",
    checkoutUrl: SPOTIFY_CHECKOUTS.quarterly,
    cta: "Comprar 3 Meses",
    badge: "Mais Popular",
    featured: true,
    features: ["Zero anúncios", "Download offline", "Economia de mais de R$ 30", "Garantia de 90 dias"],
  },
  {
    title: "Spotify Individual - 1 Ano",
    tablePrice: "239,00",
    price: "89,90",
    checkoutUrl: SPOTIFY_CHECKOUTS.annual,
    cta: "Comprar Plano Anual",
    badge: "Maior Economia",
    features: ["Zero anúncios o ano todo", "Download offline", "Sai R$ 7,49/mês", "Garantia de 12 meses"],
  },
];

const featureIcons = [CircleDollarSign, Download, Headphones, ShieldCheck];

const SpotifyPlans = () => (
  <section id="spotify-plans" className="relative z-10 border-y border-hero-foreground/10 bg-hero-foreground/[0.025] px-5 py-20 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-green-400 sm:text-xs">
          <Sparkles className="h-4 w-4" /> Oferta especial
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-hero-foreground sm:text-4xl">
          Spotify Premium <span className="text-green-400">sem anúncios.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-hero-foreground/65 sm:text-base">
          Escolha seu período, conclua o pagamento seguro pelo CN Pay e resgate sua conta pelo WhatsApp.
        </p>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {spotifyPlans.map((plan) => (
          <article
            key={plan.title}
            className={`relative flex h-full flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
              plan.featured
                ? "border-green-400/60 bg-gradient-to-b from-green-400/[0.13] to-hero-foreground/[0.035] shadow-[0_0_42px_hsl(142_70%_45%_/_0.14)]"
                : "border-hero-foreground/10 bg-hero-foreground/[0.035] hover:border-green-400/35"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-green-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                <Tag className="h-3.5 w-3.5" /> {plan.badge}
              </div>
            )}
            <div className="mb-6 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-400">
                <Headphones className="h-5 w-5" />
              </span>
              <h3 className="pt-1 font-bold text-hero-foreground">{plan.title}</h3>
            </div>
            <div className="mb-6 border-b border-hero-foreground/10 pb-5">
              <p className="text-xs text-hero-foreground/50 line-through">De R$ {plan.tablePrice}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-xs font-semibold text-hero-foreground/55">R$</span>
                <span className="text-4xl font-extrabold tracking-tight text-green-400">{plan.price}</span>
                <span className="text-xs text-hero-foreground/55">pagamento único</span>
              </p>
            </div>
            <ul className="mb-7 flex-1 space-y-3">
              {plan.features.map((feature, index) => {
                const Icon = featureIcons[index] ?? Check;
                return (
                  <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-hero-foreground/80">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                );
              })}
            </ul>
            <Button asChild className="mt-auto h-12 w-full rounded-xl bg-green-600 font-bold text-white hover:bg-green-500">
              <a href={plan.checkoutUrl} aria-label={plan.cta}>
                {plan.cta}
              </a>
            </Button>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default SpotifyPlans;
