// Central pricing map — edit values here to change amounts across the app.
export type PlanId = "mensal" | "trimestral" | "semestral" | "vitalicio";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // BRL
  period: string;
  description: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "mensal",
    name: "Plano Mensal",
    price: 47.9,
    period: "/mês",
    description: "Ideal para testar todo o ecossistema por 30 dias.",
  },
  {
    id: "trimestral",
    name: "Plano Trimestral",
    price: 97.9,
    period: "/3 meses",
    description: "Economize já no segundo mês de uso.",
  },
  {
    id: "semestral",
    name: "Plano Semestral",
    price: 137.9,
    period: "/6 meses",
    description: "6 meses de acesso completo com economia real.",
  },
  {
    id: "vitalicio",
    name: "Acesso Vitalício",
    price: 187.9,
    period: "pagamento único",
    description: "Pague uma vez, use para sempre. A escolha do Lobo.",
    highlight: true,
  },
];

export const getPlan = (id: PlanId): Plan =>
  PLANS.find((p) => p.id === id) ?? PLANS[PLANS.length - 1];