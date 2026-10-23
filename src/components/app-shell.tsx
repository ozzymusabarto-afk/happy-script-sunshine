import { useEffect, useMemo, useState } from "react";

import { GuidedTour } from "@/components/guided-tour";
import { ImpactModal } from "@/components/impact-modal";
import { InstallPrompt } from "@/components/install-prompt";
import { LockScreen } from "@/components/lock-screen";
import { PremiumButton, useIsPremium } from "@/components/premium-gate";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";

import { useAdminShortcut } from "@/hooks/use-admin-shortcut";
import {
  BookOpen,
  CloudUpload,
  Coins,
  Compass,
  Crown,
  CreditCard,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Plus,
  MoreHorizontal,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { TransactionDialog } from "@/components/transaction-dialog";
import { useAurinHydrated } from "@/hooks/use-aurin-hydrated";
import { useAppLock, useMorningReminder } from "@/hooks/use-aurin-guard";
import { usePremiumAutoSync } from "@/hooks/use-premium-sync";
import { logEvent } from "@/lib/analytics.functions";
import { brl, levelFor, TREASURY_GOAL_ID } from "@/lib/aurin";
import { registerServiceWorker } from "@/lib/register-sw";
import { SymbolBadge, userSymbol } from "@/lib/symbols";
import { cn } from "@/lib/utils";
import { currentMonthKey, monthTotals, totalWealth, useAurinStore } from "@/store/aurin-store";

const NAV = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/transacoes", label: "Gastos", icon: ScrollText },
  { to: "/orcamento", label: "Ritmo", icon: Coins },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/jornada", label: "Jornada", icon: Sparkles },
] as const;

const MORE_NAV = [
  { to: "/libertacao", label: "Resgate de Paz (dívidas)", icon: HandCoins },
  { to: "/simulador", label: "Simulador de Decisões", icon: Compass },
  { to: "/multiplicador", label: "Multiplicador (cofres)", icon: TrendingUp },
  { to: "/manual", label: "Guia do AURIN", icon: BookOpen },
  { to: "/ajustes", label: "Meus dados", icon: Settings },
  { to: "/conta", label: "Minha conta", icon: CloudUpload },
  { to: "/privacidade", label: "Privacidade e termos", icon: ShieldCheck },
] as const;

function PlanSummary() {
  const premium = useIsPremium();
  return premium ? (
    <p className="flex items-center gap-2 text-xs font-semibold text-primary">
      <Crown className="h-3.5 w-3.5" /> Premium ativo
    </p>
  ) : (
    <div className="space-y-2">
      <p className="text-xs font-semibold">Você está no plano grátis</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Gastos, ritmo, cartões, 1 cofre de sonho e 1 dívida ativa são grátis.
        Premium: Simulador de Decisões e cofres e dívidas ilimitados.
      </p>
      <PremiumButton className="w-full justify-center" label="Seja Premium · Ver planos" />
    </div>
  );
}

function MoreMenu({ mobile = false, active = false }: { mobile?: boolean; active?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Mais" className={cn(
          mobile
            ? "h-auto min-w-0 flex-1 flex-col gap-1 rounded-none px-1 py-2.5 text-[10px]"
            : "w-full justify-start gap-3 px-3 py-2.5 text-sm",
          active ? "text-primary" : "text-muted-foreground",
        )}>
          <MoreHorizontal className="h-4 w-4 shrink-0" /> Mais
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={mobile ? "top" : "right"} align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>Mais no AURIN</DropdownMenuLabel>
        {MORE_NAV.map((item) => (
          <DropdownMenuItem asChild key={item.to}>
            <Link to={item.to} className="py-2.5"><item.icon className="h-4 w-4" />{item.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-3"><PlanSummary /></div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const hydrated = useAurinHydrated();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const xp = useAurinStore((s) => s.xp);
  const goals = useAurinStore((s) => s.goals);
  const assets = useAurinStore((s) => s.assets);
  const transactions = useAurinStore((s) => s.transactions);
  const profileName = useAurinStore((s) => s.profile.name);
  const profileSymbol = useAurinStore((s) => s.profile.symbol);
  const profile = useAurinStore((s) => s.profile);
  const applyRecurring = useAurinStore((s) => s.applyRecurring);
  const security = useAurinStore((s) => s.security);
  const reminder = useAurinStore((s) => s.reminder);
  const setReminder = useAurinStore((s) => s.setReminder);
  const premium = useIsPremium();

  const { locked, unlock } = useAppLock(
    hydrated && Boolean(security.pinHash),
    security.autoLockMinutes,
    hydrated,
  );

  // Modo offline: só registra no app publicado, nunca no editor.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Registro leve de abertura do app (sem nenhum dado financeiro).
  useEffect(() => {
    void logEvent({ data: { event: "app_open" } }).catch(() => undefined);
  }, []);

  // Lançamentos fixos do mês entram sozinhos assim que o app abre.
  useEffect(() => {
    if (!hydrated) return;
    const created = applyRecurring();
    if (created > 0) {
      toast.success(
        created === 1
          ? "1 lançamento fixo deste mês foi registrado para você."
          : `${created} lançamentos fixos deste mês foram registrados para você.`,
      );
    }
  }, [hydrated, applyRecurring]);

  const level = useMemo(() => levelFor(xp), [xp]);
  const wealth = useMemo(() => totalWealth(goals, assets), [goals, assets]);
  const month = useMemo(() => monthTotals(transactions, currentMonthKey()), [transactions]);

  const dreamProgress = useMemo(() => {
    const dream = goals.find((g) => g.id !== TREASURY_GOAL_ID && g.target > 0) ?? goals[0];
    if (!dream || dream.target <= 0) return 0;
    return Math.min(100, (dream.balance / dream.target) * 100);
  }, [goals]);

  useMorningReminder(
    { ...reminder, enabled: hydrated && reminder.enabled && !locked },
    { name: profile.name, dreamName: profile.dreamName, dreamProgress },
    (day: string) => setReminder({ lastShown: day }),
    (message: string) => toast(message, { duration: 8000 }),
  );

  usePremiumAutoSync();

  // Porta discreta do guardião: Ctrl+Shift+U.
  const navigate = useNavigate();
  useAdminShortcut(() => {
    void navigate({ to: "/admin" });
  });

  if (locked) return <LockScreen onUnlock={unlock} />;

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
              <span className="block font-display text-lg font-extrabold tracking-tight">
                AURIN
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Tesouro da Babilônia
              </span>
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
            <MoreMenu active={MORE_NAV.some((item) => pathname.startsWith(item.to))} />
          </nav>


          <div className="mt-auto space-y-3">
            <PlanSummary />
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tesouro (patrimônio total)</p>
              <p className="mt-1 font-display text-xl font-bold text-gold">{brl(wealth)}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="flex justify-between gap-2">
                  <span>Entrou este mês</span>
                  <span className="text-success">{brl(month.income)}</span>
                </p>
                <p className="flex justify-between gap-2">
                  <span>Escolhas (gastos)</span>
                  <span className="text-foreground">{brl(month.expense)}</span>
                </p>
              </div>
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
                <SymbolBadge symbol={userSymbol(profileSymbol)} className="hidden lg:grid" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold sm:text-base">
                    {profileName || "Sua jornada"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={level.progress} className="h-1.5 w-28 sm:w-44" />
                    <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                      {xp} XP
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!premium && <PremiumButton className="lg:hidden" label="Grátis · Ver Premium" />}
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  aria-label="Meus dados"
                  className="lg:hidden"
                >
                  <Link to="/ajustes">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  aria-label="Nova Transação"
                  onClick={() => setOpen(true)}
                  className="bg-gold text-primary-foreground shadow-gold hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Transação</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-10">{children}</main>
          <ImpactModal />
        </div>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/95 backdrop-blur lg:hidden">
        <div className="flex pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="w-full truncate px-0.5 text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <MoreMenu mobile active={MORE_NAV.some((item) => pathname.startsWith(item.to))} />
        </div>
      </nav>

      <InstallPrompt />
      <TransactionDialog open={open} onOpenChange={setOpen} />
      <GuidedTour />
      {hydrated && <OnboardingDialog />}
    </div>
  );
}
