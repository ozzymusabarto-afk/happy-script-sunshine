import { useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Coins,
  CreditCard,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Plus,
  ScrollText,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TransactionDialog } from "@/components/transaction-dialog";
import { useAurinHydrated } from "@/hooks/use-aurin-hydrated";
import { brl, levelFor } from "@/lib/aurin";
import { cn } from "@/lib/utils";
import { currentMonthKey, monthTotals, totalWealth, useAurinStore } from "@/store/aurin-store";

const NAV = [
  { to: "/", label: "Templo", icon: LayoutDashboard },
  { to: "/transacoes", label: "Moedas", icon: ScrollText },
  { to: "/orcamento", label: "Gastos", icon: Coins },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/dividas", label: "Dívidas", icon: HandCoins },
  { to: "/multiplicador", label: "Multiplicador", short: "Multipl.", icon: TrendingUp },
  { to: "/jornada", label: "Jornada", icon: Sparkles },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useAurinHydrated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const xp = useAurinStore((s) => s.xp);
  const goals = useAurinStore((s) => s.goals);
  const assets = useAurinStore((s) => s.assets);
  const transactions = useAurinStore((s) => s.transactions);

  const level = useMemo(() => levelFor(xp), [xp]);
  const wealth = useMemo(() => totalWealth(goals, assets), [goals, assets]);
  const month = useMemo(() => monthTotals(transactions, currentMonthKey()), [transactions]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-3 px-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-extrabold tracking-tight">AURIN</span>
              <span className="block truncate text-xs text-muted-foreground">Tesouro da Babilônia</span>
            </span>
          </Link>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tesouro total</p>
            <p className="mt-1 font-display text-xl font-bold text-gold">{brl(wealth)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p className="flex justify-between gap-2">
                <span>Entradas do mês</span>
                <span className="text-success">{brl(month.income)}</span>
              </p>
              <p className="flex justify-between gap-2">
                <span>Saídas do mês</span>
                <span className="text-destructive">{brl(month.expense)}</span>
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold text-primary-foreground lg:hidden">
                  <Landmark className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold sm:text-base">
                    {level.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={level.progress} className="h-1.5 w-28 sm:w-44" />
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {xp} XP
                    </span>
                  </div>
                </div>
              </div>

              <Button aria-label="Nova Transação" onClick={() => setOpen(true)} className="shrink-0 bg-gold text-primary-foreground shadow-gold hover:opacity-90">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Transação</span>
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
        </div>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-7">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="w-full truncate px-0.5 text-center">
                  {"short" in item ? item.short : item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <TransactionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
