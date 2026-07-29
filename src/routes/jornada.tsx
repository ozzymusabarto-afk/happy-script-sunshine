import { useEffect, useMemo, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Coins,
  CreditCard,
  Crown,
  Flame,
  HandCoins,
  Landmark,
  Lock,
  Shield,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LEVELS, brl, levelFor } from "@/lib/aurin";
import { SymbolBadge, userSymbol } from "@/lib/symbols";
import { cn } from "@/lib/utils";
import {
  currentMonthKey,
  earnedBadges,
  loggingStreak,
  monthTotals,
  useAurinStore,
} from "@/store/aurin-store";

export const Route = createFileRoute("/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada e Conquistas — AURIN" },
      {
        name: "description",
        content:
          "Acompanhe seu progresso, sua constância diária e as insígnias douradas conquistadas na jornada.",
      },
      { property: "og:title", content: "Jornada e Conquistas — AURIN" },
      {
        property: "og:description",
        content: "Níveis, XP, streak de registro diário e insígnias inspiradas em Arkad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JourneyPage,
});

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "primeira-moeda": Coins,
  "escudo-babilonia": Shield,
  multiplicador: TrendingUp,
  consistencia: Flame,
  "senhor-dizimo": Crown,
  "arquiteto-futuro": Landmark,
  "sem-correntes": HandCoins,
  "mestre-fatura": CreditCard,
};

function JourneyPage() {
  const xp = useAurinStore((s) => s.xp);
  const profileName = useAurinStore((s) => s.profile.name);
  const profileSymbol = useAurinStore((s) => s.profile.symbol);
  const transactions = useAurinStore((s) => s.transactions);
  const goals = useAurinStore((s) => s.goals);
  const assets = useAurinStore((s) => s.assets);
  const badges = useAurinStore((s) => s.badges);
  const cards = useAurinStore((s) => s.cards);
  const debts = useAurinStore((s) => s.debts);
  const paidInvoices = useAurinStore((s) => s.paidInvoices);

  const level = useMemo(() => levelFor(xp), [xp]);
  const streak = useMemo(() => loggingStreak(transactions), [transactions]);
  const month = useMemo(() => monthTotals(transactions, currentMonthKey()), [transactions]);
  const list = useMemo(
    () => earnedBadges({ transactions, goals, assets, badges, cards, debts, paidInvoices }),
    [transactions, goals, assets, badges, cards, debts, paidInvoices],
  );

  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const unlocked = new Set(list.filter((b) => b.unlocked).map((b) => b.id));
    if (seen.current === null) {
      seen.current = unlocked;
      return;
    }
    for (const badge of list) {
      if (badge.unlocked && !seen.current.has(badge.id)) {
        toast.success(`Insígnia desbloqueada: ${badge.name}`);
      }
    }
    seen.current = unlocked;
  }, [list]);

  const unlockedCount = list.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <SymbolBadge symbol={userSymbol(profileSymbol)} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold sm:text-3xl">
            {profileName ? `Jornada de ${profileName}` : "Sua jornada"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Constância diária é o que transforma escolhas simples em liberdade.
          </p>
        </div>
      </header>

      <Card className="relative overflow-hidden border-primary/30">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-temple)" }}
        />
        <CardContent className="relative grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Nível {level.level}
            </Badge>
            <p className="mt-3 font-display text-3xl font-extrabold text-gold">{level.title}</p>
            <Progress value={level.progress} className="mt-4 h-2.5" />
            <p className="mt-2 text-sm text-muted-foreground">
              {level.nextTitle
                ? `${xp} XP · faltam ${level.xpToNext} XP para "${level.nextTitle}"`
                : `${xp} XP · você alcançou o topo da Babilônia`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
                <Flame className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Streak de registro</p>
                <p className="font-display text-lg font-bold">{streak} dia(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                <Trophy className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Insígnias</p>
                <p className="font-display text-lg font-bold">
                  {unlockedCount} de {list.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Insígnias da Babilônia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((badge) => {
            const Icon = BADGE_ICONS[badge.id] ?? Trophy;
            return (
              <div
                key={badge.id}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border p-4 transition-colors",
                  badge.unlocked
                    ? "border-primary/40 bg-primary/5 shadow-gold"
                    : "border-border bg-secondary/40 opacity-60",
                )}
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background",
                    badge.unlocked ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {badge.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{badge.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trilha dos títulos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {LEVELS.map((step, i) => {
            const reached = xp >= step.xp;
            return (
              <div
                key={step.title}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                    reached
                      ? "bg-gold text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-sm",
                    reached ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{step.xp} XP</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-accent/30">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Sétima cura de Arkad —{" "}
          <span className="text-foreground">aumente sua capacidade de ganhar</span>: este mês você
          registrou {month.income > 0 ? "entradas de" : "nenhuma entrada"}
          {month.income > 0 && <span className="text-success"> {brl(month.income)}</span>}. Estude,
          aprimore seu ofício e o ouro seguirá o conhecimento.
        </CardContent>
      </Card>
    </div>
  );
}
