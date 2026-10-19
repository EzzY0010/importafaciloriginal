import { CheckCircle2, Copy, Headphones, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Substitua este número pelo WhatsApp de atendimento, somente com DDI + DDD + número.
const SEUNUMERO = "5511958690389";
const WHATSAPP_TEXT = "Olá! Realizei o pagamento do Spotify no site ImportaFácil e vim resgatar minha conta.";
const WHATSAPP_URL = `https://wa.me/${SEUNUMERO}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

const SpotifySuccess = () => {
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(`+${SEUNUMERO}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-4 py-12 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-[#1ed760]/25 bg-gradient-to-b from-[#10251a] to-[#0a130d] p-7 text-center shadow-[0_24px_80px_-32px_rgba(30,215,96,.45)] sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1ed760]/15 text-[#1ed760]">
          <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1ed760]">ImportaFácil · Spotify</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Pagamento Aprovado com Sucesso! 🎉</h1>
        <p className="mt-6 text-lg font-semibold text-white/85">Seu próximo passo</p>
        <p className="mt-2 text-2xl font-extrabold text-[#1ed760]">pegue seu Spotify aqui:</p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-extrabold text-[#06210f] transition-colors hover:bg-[#42e879] sm:w-auto sm:min-w-[300px]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Resgatar pelo WhatsApp
        </a>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs text-white/55">Se preferir, copie e cole nosso número:</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <p className="text-lg font-bold tracking-wide">+{SEUNUMERO}</p>
            <button
              type="button"
              onClick={copyPhone}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
              aria-label="Copiar número de WhatsApp"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/50">
          <Headphones className="h-4 w-4 text-[#1ed760]" aria-hidden="true" />
          Envie a mensagem pré-preenchida para concluir seu resgate.
        </p>
        <Link to="/" className="mt-7 inline-block text-sm font-semibold text-white/60 underline underline-offset-4 hover:text-white">
          Voltar ao ImportaFácil
        </Link>
      </section>
    </main>
  );
};

export default SpotifySuccess;
