import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";

export const MINICURSO = {
  name: "Minicurso PDF + desafios",
  price: 27.9,
  period: "pagamento único",
  description: "Material em PDF com desafios práticos para dar o primeiro passo.",
};

interface Props {
  variant?: "hero" | "card";
}

const MinicursoBuyCard = ({ variant = "hero" }: Props) => {
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const startCheckout = async (fallbackEmail?: string) => {
    setLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error("Backend indisponível");

      const { data: { session } } = await client.auth.getSession();

      if (!session && !fallbackEmail) {
        setEmailOpen(true);
        return;
      }

      const { data, error } = await client.functions.invoke("create-payment-preference", {
        body: { email: fallbackEmail ?? session?.user.email },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;

      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento indisponível");
      window.location.href = url;
    } catch (err) {
      console.error(err);
      toast({
        title: "Não foi possível iniciar o pagamento",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isHero = variant === "hero";

  return (
    <>
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
          <span className={`text-2xl sm:text-3xl font-extrabold ${isHero ? "text-gold" : "text-foreground"}`}>
            R$ {MINICURSO.price.toFixed(2).replace(".", ",")}
          </span>
          <p className={`text-[11px] ${isHero ? "text-hero-foreground/60" : "text-muted-foreground"}`}>
            {MINICURSO.period}
          </p>
        </div>
        <Button
          onClick={() => startCheckout()}
          disabled={loading}
          className={`w-full h-11 font-bold ${
            isHero ? "bg-hero-foreground/10 text-hero-foreground hover:bg-hero-foreground/20" : ""
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Comprar"}
        </Button>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Seu e-mail</DialogTitle>
            <DialogDescription>
              Usamos o e-mail para liberar o acesso ao minicurso após o pagamento.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            translate="no"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            disabled={loading || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)}
            onClick={() => { setEmailOpen(false); startCheckout(email.trim().toLowerCase()); }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ir para o pagamento"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MinicursoBuyCard;
