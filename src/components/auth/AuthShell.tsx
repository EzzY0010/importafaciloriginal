import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";
import LanguageSelector from "@/components/LanguageSelector";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const AuthShell = ({ eyebrow, title, description, children }: AuthShellProps) => (
  <main className="min-h-screen bg-hero text-hero-foreground lg:grid lg:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)]">
    <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-gold/5 blur-3xl" aria-hidden="true" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src={wolfLogo} alt="" className="h-12 w-12 rounded-2xl object-cover ring-1 ring-gold/30" />
          <div>
            <p className="text-lg font-extrabold tracking-tight">Importa<span className="text-gold">Fácil</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-hero-foreground/45">Ecossistema de importação</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-gold">Sua operação, mais clara</p>
        <h2 className="text-4xl font-extrabold leading-[1.08] xl:text-5xl">Conhecimento e ferramentas para importar com mais confiança.</h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-hero-foreground/65">Acesse seu ecossistema de garimpo, análise de produtos, fontes globais e cálculo de custos.</p>
        <div className="mt-8 space-y-3 text-sm text-hero-foreground/75">
          {["Pesquise oportunidades em fontes globais", "Analise custos antes de decidir", "Organize sua operação em um só lugar"].map((item) => (
            <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />{item}</div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-xs text-hero-foreground/45"><ShieldCheck className="h-4 w-4 text-gold/80" /> Ambiente seguro para sua conta <ArrowRight className="ml-1 h-3 w-3" /></div>
    </section>

    <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:bg-background lg:px-12 xl:px-20">
      <div className="absolute right-5 top-5 z-20 lg:right-8 lg:top-8"><LanguageSelector /></div>
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <img src={wolfLogo} alt="ImportaFácil" className="h-11 w-11 rounded-xl object-cover ring-1 ring-gold/30" />
          <p className="text-lg font-extrabold">Importa<span className="text-gold">Fácil</span></p>
        </div>
        <div className="mb-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gold lg:text-primary">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-hero-foreground lg:text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-hero-foreground/65 lg:text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-3xl border border-hero-foreground/10 bg-hero-foreground/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm lg:border-border lg:bg-card lg:p-8 lg:shadow-strong">
          {children}
        </div>
      </div>
    </section>
  </main>
);

export default AuthShell;
