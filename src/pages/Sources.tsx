import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Search, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Item = {
  name: string;
  url: string;
  country: string;
  flag: string;
  description: string;
};

const SOURCES: Item[] = [
  { name: "DHgate", url: "https://www.dhgate.com", country: "China", flag: "🇨🇳", description: "Marketplace de réplicas e atacado direto de fábrica." },
  { name: "Yupoo", url: "https://x.yupoo.com", country: "China", flag: "🇨🇳", description: "Catálogo em álbuns de fotos reais dos fornecedores." },
  { name: "Xianyu (Taobao 2)", url: "https://2.taobao.com", country: "China", flag: "🇨🇳", description: "Desapegos chineses e produtos usados premium." },
  { name: "1688", url: "https://www.1688.com", country: "China", flag: "🇨🇳", description: "Atacado direto de fábrica a preço de custo." },
  { name: "Taobao", url: "https://www.taobao.com", country: "China", flag: "🇨🇳", description: "O maior varejo interno chinês." },
  { name: "Vinted", url: "https://www.vinted.com", country: "Europa", flag: "🇪🇺", description: "Roupas e moda usada/vintage com garimpo premium." },
  { name: "Depop", url: "https://www.depop.com", country: "Europa", flag: "🇪🇺", description: "Vitrine de streetwear jovem e peças raras." },
  { name: "Vestiaire Collective", url: "https://www.vestiairecollective.com", country: "França", flag: "🇫🇷", description: "Luxo de elite certificado por especialistas." },
  { name: "Wallapop", url: "https://es.wallapop.com", country: "Espanha", flag: "🇪🇸", description: "Eletrônicos e desapegos locais espanhóis." },
  { name: "Milanuncios", url: "https://www.milanuncios.com", country: "Espanha", flag: "🇪🇸", description: "Classificados gerais para todo tipo de garimpo." },
  { name: "eBay", url: "https://www.ebay.com", country: "EUA", flag: "🇺🇸", description: "Leilões, usados e eletrônicos premium." },
  { name: "Grailed", url: "https://www.grailed.com", country: "EUA", flag: "🇺🇸", description: "Moda masculina de luxo e streetwear." },
  { name: "Secret Sales", url: "https://www.secretsales.com", country: "Reino Unido", flag: "🇬🇧", description: "Outlet de grifes com até 80% OFF." },
  { name: "Sports Direct", url: "https://www.sportsdirect.com", country: "Reino Unido", flag: "🇬🇧", description: "Chuteiras e artigos esportivos a preço agressivo." },
  { name: "USC", url: "https://www.usc.co.uk", country: "Reino Unido", flag: "🇬🇧", description: "Streetwear e marcas premium do UK." },
  { name: "JD Sports", url: "https://www.jdsports.co.uk", country: "Reino Unido / EUA", flag: "🇬🇧", description: "Tênis e collabs exclusivas — fonte de elite." },
  { name: "Lefties", url: "https://www.lefties.com", country: "Espanha", flag: "🇪🇸", description: "Outlet oficial do grupo Zara." },
  { name: "Zalando Lounge", url: "https://www.zalando-lounge.com", country: "Europa", flag: "🇪🇺", description: "Clube de vendas privadas com grifes." },
  { name: "Zalando Privé", url: "https://www.zalando-prive.es", country: "Espanha", flag: "🇪🇸", description: "Grifes de luxo com desconto." },
  { name: "Vinted UK", url: "https://www.vinted.co.uk", country: "Reino Unido", flag: "🇬🇧", description: "Marcas inglesas em garimpo direto." },
];

const REDIRECTORS: Item[] = [
  { name: "WeZip4U", url: "https://www.wezip4u.com", country: "EUA", flag: "🇺🇸", description: "Foco no público brasileiro, suporte próximo." },
  { name: "Zip4Me", url: "https://www.zip4me.com", country: "EUA", flag: "🇺🇸", description: "Excelente para iniciantes, PT-BR no WhatsApp." },
  { name: "USCloser", url: "https://www.uscloser.com", country: "EUA", flag: "🇺🇸", description: "Otimizada para redirecionamentos em escala." },
  { name: "ViajaBox", url: "https://www.viajabox.com", country: "EUA", flag: "🇺🇸", description: "Suporte rápido via WhatsApp em português." },
  { name: "Redirect Europa", url: "https://www.redirecteuropa.com", country: "Espanha / Europa", flag: "🇪🇺", description: "Consolidação e envio direto para o Brasil." },
  { name: "CSSBuy", url: "https://www.cssbuy.com", country: "China", flag: "🇨🇳", description: "Agente de compras oficial com QC confiável." },
  { name: "ForwardVia", url: "https://www.forwardvia.com", country: "Reino Unido", flag: "🇬🇧", description: "Envio rápido da Europa/UK para o Brasil." },
  { name: "UK2Brazil", url: "https://www.uk2brazil.com", country: "Reino Unido", flag: "🇬🇧", description: "Suporte focado em brasileiros no UK." },
];

const ItemCard = ({ item }: { item: Item }) => (
  <Card className="p-4 flex flex-col gap-3 border border-border/60 hover:border-primary/40 hover:shadow-medium transition-all bg-card rounded-2xl">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground text-base leading-tight">{item.name}</h3>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
            {item.flag} {item.country}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
      </div>
    </div>
    <Button
      asChild
      size="sm"
      className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        Acessar Site <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </Button>
  </Card>
);

const Sources = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const tab = params.get("tab") === "logistics" ? "logistics" : "sources";

  const filter = (list: Item[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.country.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  };

  const filteredSources = useMemo(() => filter(SOURCES), [query]);
  const filteredRedirectors = useMemo(() => filter(REDIRECTORS), [query]);

  return (
    <div className="min-h-screen bg-background">
      <header className="header-gradient sticky top-0 z-40 shadow-medium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <h1 className="text-base sm:text-lg font-bold text-primary-foreground">
            🌎 Acesso Rápido — Fontes & Logística
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, país ou palavra-chave…"
            className="h-12 pl-10 rounded-xl"
          />
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setParams({ tab: v })}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 bg-card border border-border p-1 rounded-2xl shadow-card">
            <TabsTrigger value="sources" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              <Package className="w-4 h-4" /> Fontes Globais
            </TabsTrigger>
            <TabsTrigger value="logistics" className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium">
              <Truck className="w-4 h-4" /> Redirecionadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="mt-0">
            <div className="text-xs text-muted-foreground mb-3">
              {filteredSources.length} de {SOURCES.length} fontes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSources.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </div>
            {filteredSources.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma fonte encontrada para "{query}".
              </p>
            )}
          </TabsContent>

          <TabsContent value="logistics" className="mt-0">
            <div className="text-xs text-muted-foreground mb-3">
              {filteredRedirectors.length} de {REDIRECTORS.length} redirecionadoras
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRedirectors.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </div>
            {filteredRedirectors.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma redirecionadora encontrada para "{query}".
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Sources;