import {
  Anchor,
  Bird,
  Car,
  Coins,
  Compass,
  Crown,
  DoorOpen,
  Flame,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Mountain,
  Plane,
  ShieldCheck,
  Star,
  Store,
  Sunrise,
  TreePine,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ----------------------------- símbolo do usuário ---------------------------- */

export interface SymbolOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Símbolos pessoais — o usuário escolhe o que representa a jornada dele. */
export const USER_SYMBOLS: SymbolOption[] = [
  { id: "portal", label: "Portal", icon: DoorOpen },
  { id: "leao", label: "Leão Dourado", icon: Crown },
  { id: "escudo", label: "Escudo", icon: ShieldCheck },
  { id: "arvore", label: "Árvore", icon: TreePine },
  { id: "escultura", label: "Escultura", icon: Landmark },
  { id: "montanha", label: "Montanha", icon: Mountain },
  { id: "chama", label: "Chama", icon: Flame },
  { id: "estrela", label: "Estrela", icon: Star },
  { id: "ancora", label: "Âncora", icon: Anchor },
  { id: "bussola", label: "Bússola", icon: Compass },
];

export const DEFAULT_USER_SYMBOL = "portal";

export function userSymbol(id?: string | null): SymbolOption {
  return USER_SYMBOLS.find((s) => s.id === id) ?? USER_SYMBOLS[0];
}

/* ------------------------------ ícones de sonhos ----------------------------- */

/** Figurinhas dos Cofres de Sonhos, com palavras-chave para sugestão automática. */
export const GOAL_ICONS: (SymbolOption & { keywords: string[] })[] = [
  {
    id: "casa",
    label: "Casa Própria",
    icon: Home,
    keywords: ["casa", "lar", "apart", "morad", "imóvel", "imovel"],
  },
  {
    id: "carro",
    label: "Carro",
    icon: Car,
    keywords: ["carro", "moto", "veícul", "veicul", "auto"],
  },
  {
    id: "viagem",
    label: "Viagem",
    icon: Plane,
    keywords: ["viag", "trip", "praia", "europa", "férias", "ferias"],
  },
  { id: "liberdade", label: "Liberdade", icon: Bird, keywords: ["liberdade", "livre", "independ"] },
  {
    id: "estudos",
    label: "Estudos",
    icon: GraduationCap,
    keywords: ["estud", "curso", "facul", "escola", "mba"],
  },
  {
    id: "reserva",
    label: "Reserva",
    icon: ShieldCheck,
    keywords: ["reserva", "emerg", "segur", "proteç", "protec"],
  },
  {
    id: "familia",
    label: "Família",
    icon: Heart,
    keywords: ["famíl", "famil", "filh", "casamento", "amor", "saúde", "saude"],
  },
  {
    id: "negocio",
    label: "Negócio",
    icon: Store,
    keywords: ["negóc", "negoc", "empres", "loja", "startup"],
  },
  {
    id: "aposentadoria",
    label: "Aposentadoria",
    icon: Sunrise,
    keywords: ["aposent", "futuro", "velhice"],
  },
  {
    id: "tesouro",
    label: "Tesouro",
    icon: Coins,
    keywords: ["tesouro", "ouro", "invest", "dízimo", "dizimo"],
  },
];

export const DEFAULT_GOAL_ICON = "tesouro";

/** Sugere uma figurinha a partir do nome do sonho. */
export function inferGoalIcon(name: string): string {
  const clean = (name ?? "").toLowerCase();
  for (const opt of GOAL_ICONS) {
    if (opt.keywords.some((k) => clean.includes(k))) return opt.id;
  }
  return DEFAULT_GOAL_ICON;
}

export function goalIcon(id?: string | null): SymbolOption {
  return GOAL_ICONS.find((g) => g.id === id) ?? GOAL_ICONS[GOAL_ICONS.length - 1];
}

/* --------------------------------- componentes -------------------------------- */

/** Selo dourado circular usado para símbolos pessoais e figurinhas de sonho. */
export function SymbolBadge({
  symbol,
  size = "md",
  className,
}: {
  symbol: SymbolOption;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = symbol.icon;
  const box = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const glyph = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/15 text-primary",
        box,
        className,
      )}
      role="img"
      aria-label={symbol.label}
    >
      <Icon className={glyph} />
    </span>
  );
}

/** Grade de escolha reutilizável (símbolo pessoal ou figurinha de sonho). */
export function SymbolPicker({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SymbolOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl border transition-colors",
              active
                ? "border-primary bg-primary/20 text-primary shadow-gold"
                : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
