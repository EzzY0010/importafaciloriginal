import { Home, Camera, Package, Calculator, User } from "lucide-react";

interface BottomNavProps {
  active: string;
  onSelect: (key: string) => void;
}

const items = [
  { key: "home", label: "Início", icon: Home, tour: undefined },
  { key: "chat", label: "Analisar", icon: Camera, tour: "ai" },
  { key: "sources", label: "Fornecedores", icon: Package, tour: "quick-access" },
  { key: "calculator", label: "Calculadora", icon: Calculator, tour: "calculator" },
  { key: "profile", label: "Perfil", icon: User, tour: undefined },
];

const BottomNav = ({ active, onSelect }: BottomNavProps) => (
  <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
    <div className="max-w-3xl mx-auto grid grid-cols-5">
      {items.map(({ key, label, icon: Icon, tour }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            data-tour={tour}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="leading-none">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
