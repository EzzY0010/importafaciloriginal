import { useMemo, useState } from "react";
import { ExternalLink, Search, Package, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SOURCES, REDIRECTORS, type SourceItem } from "@/data/sources";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "sources" | "logistics";
}

const ItemCard = ({ item }: { item: SourceItem }) => (
  <Card className="p-3 flex flex-col gap-2 border border-border/60 hover:border-primary/40 hover:shadow-medium transition-all bg-card rounded-xl">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h3>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
          {item.flag} {item.country}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.description}</p>
    </div>
    <Button asChild size="sm" className="w-full h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        Acessar <ExternalLink className="w-3 h-3" />
      </a>
    </Button>
  </Card>
);

const SourcesDialog = ({ open, onOpenChange, defaultTab = "sources" }: Props) => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"sources" | "logistics">(defaultTab);

  const filter = (list: SourceItem[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.country.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  };

  const fSources = useMemo(() => filter(SOURCES), [query]);
  const fRedir = useMemo(() => filter(REDIRECTORS), [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-base sm:text-lg">🌎 Fornecedores & Redirecionadoras</DialogTitle>
        </DialogHeader>
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, país ou palavra-chave…"
              className="h-10 pl-9 rounded-xl"
            />
          </div>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "sources" | "logistics")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 mx-5 bg-muted p-1 rounded-xl">
            <TabsTrigger value="sources" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4" /> Fontes ({fSources.length})
            </TabsTrigger>
            <TabsTrigger value="logistics" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Truck className="w-4 h-4" /> Redirect ({fRedir.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TabsContent value="sources" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {fSources.map((item) => <ItemCard key={item.name} item={item} />)}
              </div>
            </TabsContent>
            <TabsContent value="logistics" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {fRedir.map((item) => <ItemCard key={item.name} item={item} />)}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SourcesDialog;