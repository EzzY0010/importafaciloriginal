import { Users, ShieldCheck, ShieldX, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewCardsProps {
  total: number;
  active: number;
  banned: number;
  paid: number;
}

const OverviewCards = ({ total, active, banned, paid }: OverviewCardsProps) => {
  const stats = [
    { label: "Total Usuários", value: total, icon: Users, color: "text-primary" },
    { label: "Ativos", value: active, icon: ShieldCheck, color: "text-green-500" },
    { label: "Banidos", value: banned, icon: ShieldX, color: "text-destructive" },
    { label: "Pagantes", value: paid, icon: CreditCard, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-muted ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;
