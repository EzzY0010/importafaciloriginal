import { useEffect, useState } from "react";
import { Camera, Package, Calculator, Globe, Truck, ChevronRight, ShieldCheck } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";

export interface CalcSnapshot {
  id: string;
  savedAt: number;
  label: string;
  totalCost: number;
  totalProfit: number;
}

const readHistory = (): CalcSnapshot[] => {
  try {
    const raw = localStorage.getItem("importafacil:calc-history");
    return raw ? (JSON.parse(raw) as CalcSnapshot[]) : [];
  } catch {
    return [];
  }
};

interface HomeViewProps {
  onAnalyze: () => void;
  onSources: () => void;
  onCalculator: () => void;
}

const HomeView = ({ onAnalyze, onSources, onCalculator }: HomeViewProps) => {
  const [history, setHistory] = useState<CalcSnapshot[]>([]);

  useEffect(() => {
    setHistory(readHistory());
    const onStorage = () => setHistory(readHistory());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <section className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-foreground">
            O que você quer<br />
            <span className="text-primary">importar</span> hoje?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use o Lobo das Importações e tenha dados reais para lucrar mais.
          </p>
        </div>
        <img
          src={wolfLogo}
          alt="Lobo das Importações"
          loading="lazy"
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0"
        />
      </section>

      {/* Cards de ação */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onAnalyze}
          className="text-left rounded-2xl p-4 bg-primary text-primary-foreground shadow-medium hover:opacity-95 transition-opacity"
        >
          <div className="w-11 h-11 rounded-full bg-primary-foreground/15 flex items-center justify-center mb-3">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="font-bold">Analisar produto</h3>
          <p className="text-xs opacity-80 mt-1">
            Envie uma foto e descubra marca, peso e margem estimada.
          </p>
          <span className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background text-foreground px-4 py-2.5 text-sm font-bold">
            Enviar foto <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={onSources}
          className="text-left rounded-2xl p-4 bg-accent text-accent-foreground shadow-medium hover:opacity-95 transition-opacity"
        >
          <div className="w-11 h-11 rounded-full bg-background/25 flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold">Encontrar fornecedor</h3>
          <p className="text-xs opacity-90 mt-1">
            Fontes e redirecionadoras confiáveis para o que você quer.
          </p>
          <span className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background text-foreground px-4 py-2.5 text-sm font-bold">
            Buscar agora <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </section>

      {/* Ferramentas rápidas */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-3">Ferramentas rápidas</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Calculator, title: "Calculadora", desc: "Custos, frete e margem", action: onCalculator },
            { icon: Globe, title: "Fornecedores", desc: "Nossa base de fontes", action: onSources },
            { icon: Truck, title: "Redirecionadoras", desc: "Compare e escolha", action: onSources },
          ].map(({ icon: Icon, title, desc, action }) => (
            <button
              key={title}
              type="button"
              onClick={action}
              className="text-left rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-bold text-foreground leading-tight">{title}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Análises recentes (Últimas Simulações da Calculadora) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground">Análises recentes</h3>
          <button
            type="button"
            onClick={onCalculator}
            className="text-xs font-bold text-primary inline-flex items-center gap-1"
          >
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma simulação ainda</p>
            <button
              type="button"
              onClick={onCalculator}
              className="mt-2 text-xs font-bold text-primary"
            >
              Fazer minha primeira simulação
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 3).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={onCalculator}
                className="w-full text-left rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground truncate">{h.label}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(h.savedAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex gap-6 mt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Custo est.</p>
                    <p className="text-sm font-bold text-foreground">
                      R$ {h.totalCost.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Lucro est.</p>
                    <p className={`text-sm font-bold ${h.totalProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      R$ {h.totalProfit.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Banner de confiança */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Importe com segurança e dados reais</p>
          <p className="text-xs text-muted-foreground">
            Decisões com base em informação, não em achismo. Conte com o Lobo.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          className="text-xs font-bold text-primary border border-primary/30 rounded-xl px-3 py-2 shrink-0"
        >
          Saiba mais
        </button>
      </section>
    </div>
  );
};

export default HomeView;
