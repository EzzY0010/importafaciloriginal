import { Home, Package, Calculator, User } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo-clean.png";

interface BottomNavProps {
  active: string;
  onSelect: (key: string) => void;
}

const items = [
  { key: "home", label: "Início", icon: Home, tour: "nav-home" },
  { key: "chat", label: "IA Lobo", icon: null, tour: "ai" },
  { key: "sources", label: "Fontes", icon: Package, tour: "quick-access" },
  { key: "calculator", label: "Calculadora", icon: Calculator, tour: "calculator" },
  { key: "profile", label: "Perfil", icon: User, tour: "nav-profile" },
];

const BottomNav = ({ active, onSelect }: BottomNavProps) => (
  <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
    <div className="mx-auto grid max-w-3xl grid-cols-5">
      {items.map(({ key, label, icon: Icon, tour }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            data-tour={tour}
            onClick={() => onSelect(key)}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold transition-all duration-200 ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon ? (
              <Icon className="w-5 h-5" />
            ) : (
              <img
                src={wolfLogo}
                alt="Lobo das Importações"
                className={`w-5 h-5 rounded-full object-cover transition-opacity ${isActive ? "opacity-100" : "opacity-70"}`}
              />
            )}
            <span className="leading-none whitespace-nowrap max-w-full truncate">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
