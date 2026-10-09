import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSupabaseClient } from "@/lib/backend";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  functionName: "appcnpay-pix" | "appcnpay-minicurso";
  title: string;
  amount: number;
  extraBody?: Record<string, unknown>;
  askEmail?: boolean;
}

const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

type Pix = { identifier: string; code: string; image: string | null };

const PixCheckoutDialog = ({ open, onOpenChange, functionName, title, amount, extraBody, askEmail }: Props) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<Pix | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "failed">("pending");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pix || status !== "pending") return;
    const id = setInterval(async () => {
      const client = await getSupabaseClient();
      const { data } = (await client?.functions.invoke("appcnpay-status", { body: { identifier: pix.identifier } })) ?? {};
      if (data?.status === "approved") setStatus("approved");
      else if (data?.status === "failed") setStatus("failed");
    }, 5000);
    return () => clearInterval(id);
  }, [pix, status]);

  useEffect(() => {
    if (status !== "approved") return;
    const t = setTimeout(() => navigate("/login"), 2500);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const generate = async () => {
    setLoading(true); setError(null);
    try {
      const client = await getSupabaseClient();
      if (!client) throw new Error("Serviço indisponível. Tente novamente.");
      const { data, error: err } = await client.functions.invoke(functionName, {
        body: { ...extraBody, name, document: cpf.replace(/\D/g, ""), phone: phone.replace(/\D/g, ""), ...(askEmail ? { email: email.trim().toLowerCase() } : {}) },
      });
      if (err) {
        let msg = "Não foi possível gerar o Pix, tente novamente.";
        try { const b = await (err as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* keep */ }
        throw new Error(msg);
      }
      if (!data?.code) throw new Error("Não foi possível gerar o Pix, tente novamente.");
      setPix({ identifier: data.identifier, code: data.code, image: data.image });
      setStatus("pending");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const valid = name.trim().length >= 3 && cpf.replace(/\D/g, "").length === 11 &&
    (!askEmail || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setPix(null); setError(null); setStatus("pending"); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Pagamento via Pix · R$ {amount.toFixed(2).replace(".", ",")}</DialogDescription>
        </DialogHeader>

        {status === "approved" ? (
          <div className="text-center py-6 space-y-3 animate-fade-in">
            <CheckCircle className="w-14 h-14 mx-auto text-primary" />
            <p className="font-bold text-foreground">Pagamento aprovado!</p>
            <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
            <Button className="w-full" onClick={() => navigate("/login")}>Acessar agora</Button>
          </div>
        ) : status === "failed" ? (
          <div className="text-center py-6 space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="font-semibold text-foreground">Pagamento não concluído.</p>
            <Button className="w-full" onClick={() => { setPix(null); setStatus("pending"); }}>Gerar novo Pix</Button>
          </div>
        ) : pix ? (
          <div className="space-y-3 text-center">
            <div className="bg-background p-3 rounded-xl inline-block border border-border">
              {pix.image ? <img src={pix.image} alt="QR Code Pix" className="w-48 h-48" /> : <QRCodeSVG value={pix.code} size={192} />}
            </div>
            <Button onClick={copy} variant="outline" className="w-full gap-2">
              <Copy className="w-4 h-4" /> {copied ? "Copiado!" : "Copiar código Pix"}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Aguardando pagamento...
            </p>
            <p className="text-[11px] text-muted-foreground">Abra o app do seu banco, escolha Pix e escaneie o QR Code ou cole o código.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {askEmail && <Input type="email" translate="no" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />}
            <Input translate="no" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
            <Input translate="no" inputMode="numeric" placeholder="CPF" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} />
            <Input translate="no" inputMode="tel" placeholder="WhatsApp (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full font-bold" disabled={!valid || loading} onClick={generate}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar Pix"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixCheckoutDialog;
