import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CN_PAY_CHECKOUTS } from "@/config/checkouts";

export const MINICURSO = {
  name: "Minicurso PDF + desafios",
  price: 14.99,
  previousPrice: 27.9,
  period: "pagamento único",
  description: "7 PDFs, um para cada dia, cada um contendo um desafio.",
};

interface Props {
  variant?: "hero" | "card";
}

const MinicursoBuyCard = ({ variant = "hero" }: Props) => {
  const isHero = variant === "hero";

  return (
    <div
      className={
        isHero
          ? "relative flex flex-col p-5 rounded-2xl border bg-hero-foreground/5 border-hero-foreground/15 hover:border-gold/40 transition-all"
          : "relative flex flex-col p-5 rounded-2xl border-2 border-border bg-card"
      }
    >
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className={isHero ? "w-4 h-4 text-gold" : "w-4 h-4 text-primary"} />
        <h3 className={`font-bold text-base ${isHero ? "text-hero-foreground" : "text-foreground"}`}>
          {MINICURSO.name}
        </h3>
      </div>
      <p className={`text-xs min-h-[32px] ${isHero ? "text-hero-foreground/60" : "text-muted-foreground"}`}>
        {MINICURSO.description}
      </p>
      <div className="my-4">
        <span className={`text-xs line-through block ${isHero ? "text-hero-foreground/60" : "text-muted-foreground"}`}>
          De R$ 27,90
        </span>
        <span className={`text-2xl sm:text-3xl font-extrabold ${isHero ? "text-gold" : "text-foreground"}`}>
          R$ {MINICURSO.price.toFixed(2).replace(".", ",")}
        </span>
        <span className="ml-2 text-[10px] bg-gold text-gold-foreground rounded-full px-2 py-0.5">-46%</span>
        <p className={`text-[11px] ${isHero ? "text-hero-foreground/60" : "text-muted-foreground"}`}>
          {MINICURSO.period}
        </p>
      </div>
      <Button
        asChild
        className={`w-full h-11 font-bold ${
          isHero ? "bg-hero-foreground/10 text-hero-foreground hover:bg-hero-foreground/20" : ""
        }`}
      >
        <a href={CN_PAY_CHECKOUTS.minicurso}>Escolher</a>
      </Button>
    </div>
  );
};

export default MinicursoBuyCard;
