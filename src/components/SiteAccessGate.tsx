import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ELITE_CHECKOUT_URL = "https://checkout.appcnpay.com/checkout/cmv1ujiwd0khe01q0wotd9gr5?offer=1DUNPV5";

const SiteAccessGate = () => (
  <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-12">
    <div className="w-full rounded-3xl border border-gold/25 bg-card p-7 text-center shadow-card sm:p-9">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <LockKeyhole className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">Acesso restrito</p>
      <h1 className="text-2xl font-extrabold text-foreground">Acesso ao site indisponível</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        As Fontes e ferramentas do site ficam disponíveis nos planos com acesso à plataforma.
      </p>
      <Button asChild className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <a href={ELITE_CHECKOUT_URL}>
          <Sparkles className="h-4 w-4" /> Conhecer o Importafacil Elite
        </a>
      </Button>
    </div>
  </div>
);

export default SiteAccessGate;
