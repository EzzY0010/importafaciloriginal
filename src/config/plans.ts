// Central pricing map — edit values here to change amounts across the app.
export type PlanId = "mensal" | "trimestral" | "anual";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // BRL
  period: string;
  description: string;
  monthlyEquivalent?: string;
  support: string;
  durationDays: number;
  highlight?: boolean;
}

export const PLAN_FEATURES = [
  "IA Especialista em Importação",
  "Busca Global Copia e Cola",
  "Calculadora Pro",
  "Mais de 15 fontes de garimpo",
  "Acompanhamento na primeira importação",
  "Acesso ao grupo de WhatsApp",
];

export const PLANS: Plan[] = [
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 97,
    period: "/mês · cobrança mensal",
    description: "Ideal para testar todo o ecossistema por 30 dias.",
    support: "Suporte para dúvidas em até 48h",
    durationDays: 30,
  },
  {
    id: "trimestral",
    name: "Plano Trimestral",
    price: 239,
    period: "/3 meses",
    monthlyEquivalent: "≈ R$ 79,67/mês",
    description: "3 meses de acesso completo com economia.",
    support: "Suporte para dúvidas em até 24h–48h",
    durationDays: 90,
  },
  {
    id: "anual",
    name: "Plano Anual",
    price: 499,
    period: "/ano",
    monthlyEquivalent: "≈ R$ 41,58/mês",
    description: "Um ano inteiro de acesso pelo menor preço por mês.",
    support: "Suporte prioritário em até 24h",
    durationDays: 365,
    highlight: true,
  },
];

export const getPlan = (id: PlanId): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[PLANS.length - 1];
