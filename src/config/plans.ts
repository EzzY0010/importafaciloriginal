// Central pricing map — edit values here to change amounts across the app.
export type PlanId = "mensal" | "trimestral" | "anual" | "autonomo";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  previousPrice?: number;
  period: string;
  description: string;
  monthlyEquivalent?: string;
  support: string;
  durationDays: number;
  highlight?: boolean;
  features: string[];
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
    id: "autonomo",
    name: "Acesso ao Site (plano mensal)",
    price: 34.99,
    period: "/mês · 30 dias",
    description: "Somente acesso ao site e ao grupo de importação. Não contém acompanhamento nem suporte do ADM para dúvidas sobre importação. As dúvidas são tiradas somente na interação com o grupo.",
    support: "Sem suporte do ADM",
    durationDays: 30,
    features: ["Site completo", "Acesso ao grupo de importação", "Sem acompanhamento", "Sem suporte do ADM"],
  },
  {
    id: "mensal",
    name: "Mentoria (plano mensal)",
    price: 97,
    previousPrice: 239,
    period: "/mês · cobrança mensal",
    description: "Acompanhamento completo por 30 dias.",
    support: "Suporte para dúvidas em até 48h",
    durationDays: 30,
    features: PLAN_FEATURES,
  },
  {
    id: "trimestral",
    name: "Mentoria (plano trimestral)",
    price: 239,
    previousPrice: 499,
    period: "/3 meses",
    monthlyEquivalent: "≈ R$ 79,67/mês",
    description: "3 meses de mentoria com economia.",
    support: "Suporte para dúvidas em até 24h–48h",
    durationDays: 90,
    features: PLAN_FEATURES,
  },
  {
    id: "anual",
    name: "Mentoria (plano anual)",
    price: 499,
    previousPrice: 799,
    period: "/ano",
    monthlyEquivalent: "≈ R$ 41,58/mês",
    description: "Um ano de mentoria pelo menor preço mensal.",
    support: "Suporte prioritário em até 24h",
    durationDays: 365,
    highlight: true,
    features: PLAN_FEATURES,
  },
];

export const getPlan = (id: PlanId): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[PLANS.length - 1];

export const getDiscountPercent = (plan: Plan) =>
  plan.previousPrice ? Math.round((1 - plan.price / plan.previousPrice) * 100) : null;
