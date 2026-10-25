import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BEGINNERS_CHECKOUT_URL } from "@/config/checkouts";

const BeginnersGate = ({ expired = false }: { expired?: boolean }) => (
  <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4 py-12">
    <div className="w-full rounded-3xl border border-gold/25 bg-card p-7 text-center shadow-card sm:p-9">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <LockKeyhole className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">{expired ? "Acesso expirado" : "Acesso limitado"}</p>
      <h1 className="text-2xl font-extrabold text-foreground">{expired ? "Seu acesso Beginners venceu" : "Disponível no Importafacil Elite"}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {expired ? "Renove o Beginners para voltar a usar a Calculadora Pro." : "O plano Beginners inclui a Calculadora Pro e o grupo exclusivo. IA, Fontes e as demais ferramentas ficam disponíveis no Importafacil Elite."}
      </p>
      <Button asChild className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <a href={expired ? BEGINNERS_CHECKOUT_URL : "https://checkout.appcnpay.com/checkout/cmv1ujiwd0khe01q0wotd9gr5?offer=1DUNPV5"}>
          <Sparkles className="h-4 w-4" /> {expired ? "Renovar Beginners" : "Conhecer o Importafacil Elite"}
        </a>
      </Button>
    </div>
  </div>
);

export default BeginnersGate;
