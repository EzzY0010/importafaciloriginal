import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/lib/backend";
import SpotifyPlans from "@/components/SpotifyPlans";

const MoreTools = () => {
  const [virtualService, setVirtualService] = useState<"Vinted" | "Depop" | "">("");
  const [virtualCountry, setVirtualCountry] = useState("");
  const [virtualPayLoading, setVirtualPayLoading] = useState(false);
  const { toast } = useToast();
  const VIRTUAL_NUMBER_PRICE = 12.0;
  const virtualCountryOptions: Record<string, string[]> = {
    Vinted: ["Espanha", "Reino Unido", "Portugal"],
    Depop: ["EUA"],
  };

  const handleVirtualNumberPayment = async () => {
    if (!virtualService || !virtualCountry || virtualPayLoading) return;
    setVirtualPayLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error("Backend indisponível");
      const { data: { session } } = await client.auth.getSession();
      const { data, error } = await client.functions.invoke("virtual-number-payment", {
        body: { service: virtualService, country: virtualCountry },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      const url = data?.init_point || data?.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento indisponível");
      window.location.href = url;
    } catch (err) {
      console.error(err);
      toast({ title: "Não foi possível iniciar o pagamento", description: "Tente novamente em instantes.", variant: "destructive" });
      setVirtualPayLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-hero text-hero-foreground">
      <header className="sticky top-0 z-40 border-b border-hero-foreground/10 bg-hero/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-hero-foreground/75 transition-colors hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Voltar para o ImportaFácil
          </Link>
          <Link to="/login" className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-gold-foreground transition-colors hover:bg-gold/90">Entrar</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-6 sm:pt-24">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-gold/80">Mais Ferramentas</p>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">Recursos extras para sua operação internacional.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-hero-foreground/65">Spotify e números virtuais ficam aqui, separados do produto principal, para você encontrar cada solução no momento certo.</p>
      </section>

      <section className="border-y border-hero-foreground/5 bg-hero-foreground/[0.018] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl"><SpotifyPlans /></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold"><Smartphone className="h-6 w-6" /></div>
            <h2 className="text-3xl font-extrabold">Números Virtuais SMS</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-hero-foreground/65">Gere números virtuais para verificar contas na Vinted, Depop e outras plataformas do exterior sem expor seu número pessoal.</p>
          </div>
          <div className="rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.035] p-5 sm:p-7">
            <Dialog>
              <DialogTrigger asChild><Button className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground hover:bg-gold/90">Gerar número virtual</Button></DialogTrigger>
              <DialogContent className="bg-hero text-hero-foreground sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-hero-foreground">Solicitar número virtual</DialogTitle>
                  <DialogDescription className="text-hero-foreground/60">Escolha o serviço e o país. Após a confirmação, você recebe o número pelo WhatsApp.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label className="text-hero-foreground">Serviço</Label><Select value={virtualService} onValueChange={(value) => { setVirtualService(value as "Vinted" | "Depop"); setVirtualCountry(""); }}><SelectTrigger className="border-hero-foreground/15 bg-hero-foreground/5 text-hero-foreground"><SelectValue placeholder="Selecione o serviço" /></SelectTrigger><SelectContent className="border-hero-foreground/15 bg-hero text-hero-foreground"><SelectItem value="Vinted">Vinted</SelectItem><SelectItem value="Depop">Depop</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-hero-foreground">País</Label><Select value={virtualCountry} onValueChange={setVirtualCountry} disabled={!virtualService}><SelectTrigger className="border-hero-foreground/15 bg-hero-foreground/5 text-hero-foreground"><SelectValue placeholder={virtualService ? "Selecione o país" : "Escolha um serviço primeiro"} /></SelectTrigger><SelectContent className="border-hero-foreground/15 bg-hero text-hero-foreground">{virtualService && virtualCountryOptions[virtualService].map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="rounded-xl border border-hero-foreground/10 bg-hero-foreground/5 p-4 text-center"><p className="text-xs text-hero-foreground/60">Valor único por número</p><p className="mt-1 text-3xl font-extrabold text-gold">R$ {VIRTUAL_NUMBER_PRICE.toFixed(2).replace(".", ",")}</p></div>
                <Button onClick={handleVirtualNumberPayment} disabled={!virtualService || !virtualCountry || virtualPayLoading} className="h-12 w-full rounded-xl bg-gold font-bold text-gold-foreground hover:bg-gold/90">{virtualPayLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pagar R$ ${VIRTUAL_NUMBER_PRICE.toFixed(2).replace(".", ",")} e gerar número`}</Button>
                <p className="text-center text-[11px] text-hero-foreground/50">Pagamento seguro via Mercado Pago. Após a confirmação, o pedido segue para o WhatsApp.</p>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="border-t border-hero-foreground/5 bg-hero-foreground/[0.018] px-5 py-14 text-center sm:px-6">
        <MessageCircle className="mx-auto h-7 w-7 text-gold" />
        <h2 className="mt-4 text-2xl font-extrabold">Comunidade de importadores</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-hero-foreground/60">Acesse o grupo gratuito pelo próprio site quando quiser trocar experiências e acompanhar novidades.</p>
        <a href="https://chat.whatsapp.com/FISWT8vu8SX8RqymoUirJZ?s=cl&p=a&mlu=4&ilr=4" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold/40 px-5 text-sm font-bold text-gold transition-colors hover:bg-gold/10"><MessageCircle className="h-4 w-4" /> Entrar no grupo gratuito</a>
      </section>
    </main>
  );
};

export default MoreTools;
