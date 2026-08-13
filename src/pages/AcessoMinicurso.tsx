import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileDown, Loader2, Lock, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/backend";

interface MinicursoFile {
  name: string;
  url: string;
  size: number | null;
}

const DESAFIOS = [
  "Desafio 1 — Escolha um produto e simule o custo total na Calculadora.",
  "Desafio 2 — Compare duas fontes diferentes para o mesmo item.",
  "Desafio 3 — Escolha uma redirecionadora e calcule o frete real.",
  "Desafio 4 — Defina seu preço de venda e valide a margem.",
  "Desafio 5 — Faça sua primeira compra teste de baixo valor.",
];

const AcessoMinicurso = () => {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [files, setFiles] = useState<MinicursoFile[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const client = await getSupabaseClient();
        if (!client) return;
        const { data: { session } } = await client.auth.getSession();
        if (!session) return;
        const { data } = await client.functions.invoke("minicurso-files", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setAccess(Boolean(data?.access));
        setFiles(data?.files ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (paymentStatus === "pending" && !access) {
    return (
      <StatusScreen
        icon={<Clock className="w-8 h-8 text-accent" />}
        title="Pagamento em análise"
        text="Assim que o Mercado Pago confirmar o pagamento, seu acesso é liberado automaticamente nesta página."
      />
    );
  }

  if (paymentStatus === "failure" && !access) {
    return (
      <StatusScreen
        icon={<XCircle className="w-8 h-8 text-destructive" />}
        title="Pagamento não aprovado"
        text="O pagamento não foi concluído. Você pode tentar novamente na página de planos."
      />
    );
  }

  if (!access) {
    return (
      <StatusScreen
        icon={<Lock className="w-8 h-8 text-muted-foreground" />}
        title="Acesso não encontrado"
        text="Não localizamos uma compra aprovada vinculada à sua conta. Entre com o e-mail usado na compra ou adquira o minicurso."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minicurso PDF + Desafios</h1>
          <p className="text-sm text-muted-foreground">Acesso liberado. Bons estudos!</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Materiais em PDF</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Os materiais serão publicados em breve.</p>
            ) : (
              files.map((f) => (
                <a
                  key={f.name}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 hover:border-primary/40 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                  <FileDown className="w-4 h-4 text-primary shrink-0" />
                </a>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Desafios</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {DESAFIOS.map((d) => (
              <p key={d} className="text-sm text-muted-foreground">• {d}</p>
            ))}
          </CardContent>
        </Card>

        <Button variant="outline" asChild><Link to="/dashboard">Voltar ao painel</Link></Button>
      </div>
    </div>
  );
};

const StatusScreen = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-md text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">{icon}</div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{text}</p>
      <div className="flex gap-2 justify-center">
        <Button asChild><Link to="/#plans-section">Ver planos</Link></Button>
        <Button variant="outline" asChild><Link to="/login">Entrar</Link></Button>
      </div>
    </div>
  </div>
);

export default AcessoMinicurso;
