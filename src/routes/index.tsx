import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  CreditCard as CardIcon,
  HandCoins,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { FreedomMeter, JourneyTrail, VaultJar } from "@/components/journey-visuals";
import { monthsOfFreedom } from "@/lib/impact";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  brl,
  formatDate,
  monthLabel,
  quoteOfTheDay,
  PAYMENT_LABELS,
} from "@/lib/aurin";
import {
  cardSummary,
  currentMonthKey,
  debtSummary,
  flowSeries,
  monthTotals,
  pillarUsage,
  totalWealth,
  useAurinStore,
} from "@/store/aurin-store";
import { PILLARS, daysUntil } from "@/lib/aurin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Templo AURIN — Painel do seu tesouro" },
      {
        name: "description",
        content:
          "Acompanhe tesouro total, entradas, saídas e o dízimo de Arkad em um painel financeiro gamificado.",
      },
      { property: "og:title", content: "Templo AURIN — Painel do seu tesouro" },
      {
        property: "og:description",
        content: "Visão completa do seu ouro: fluxo mensal, categorias e as leis da Babilônia.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const transactions = useAurinStore((s) => s.transactions);
  const goals = useAurinStore((s) => s.goals);
  const assets = useAurinStore((s) => s.assets);
  const cards = useAurinStore((s) => s.cards);
  const debtList = useAurinStore((s) => s.debts);
  const paidInvoices = useAurinStore((s) => s.paidInvoices);
  const pillarSplit = useAurinStore((s) => s.pillarSplit);

  const key = currentMonthKey();
  const month = useMemo(() => monthTotals(transactions, key), [transactions, key]);
  const wealth = useMemo(() => totalWealth(goals, assets), [goals, assets]);
  const flow = useMemo(
    () => flowSeries(transactions).map((d) => ({ ...d, mes: monthLabel(d.key) })),
    [transactions],
  );
  const trail = useMemo(
    () =>
      flow.map((d) => ({
        key: d.key,
        label: d.mes,
        saved: d.tesouro,
        balance: d.entrada - d.saida,
      })),
    [flow],
  );
  const freedomMonths = useMemo(() => monthsOfFreedom(wealth, transactions), [wealth, transactions]);
  const vaults = useMemo(
    () =>
      [...goals]
        .sort((a, b) => b.balance / (b.target || 1) - a.balance / (a.target || 1))
        .slice(0, 3)
        .map((g) => ({ id: g.id, name: g.name, balance: g.balance, target: g.target })),
    [goals],
  );
  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [transactions],
  );

  const cardStats = useMemo(
    () =>
      cards.map((c) => {
        const summary = cardSummary(c, transactions, paidInvoices);
        const due = summary.current?.due ?? summary.next?.due;
        return {
          id: c.id,
          name: c.name,
          limit: c.limit,
          committed: summary.committed,
          available: summary.available,
          usage: summary.usage,
          dueIn: due ? daysUntil(due) : null,
        };
      }),
    [cards, transactions, paidInvoices],
  );
  const debts = useMemo(() => debtSummary(debtList), [debtList]);
  const pillars = useMemo(
    () => pillarUsage(transactions, key, pillarSplit, month.tithe),
    [transactions, key, pillarSplit, month.tithe],
  );

  const titheTarget = month.income * 0.1;
  const tithePercent = titheTarget > 0 ? Math.min(100, (month.tithe / titheTarget) * 100) : 0;
  const quote = quoteOfTheDay();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-temple)" }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Tesouro Total</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-gold sm:text-5xl">
              {brl(wealth)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cofres, investimentos e ativos fixos reunidos sob a proteção de Arkad.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatTile
                icon={<ArrowUpRight className="h-4 w-4" />}
                label="Ouro Entrada (mês)"
                value={brl(month.income)}
                tone="success"
              />
              <StatTile
                icon={<ArrowDownRight className="h-4 w-4" />}
                label="Ouro Saída (mês)"
                value={brl(month.expense)}
                tone="destructive"
              />
            </div>
          </div>

          <Card className="min-w-0 border-primary/30 bg-background/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-4 w-4 text-primary" />O Dízimo de Arkad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-bold">
                {brl(month.tithe)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  de {brl(titheTarget)}
                </span>
              </p>
              <Progress value={tithePercent} className="mt-3 h-2" />
              <p className="mt-3 text-xs text-muted-foreground">
                {tithePercent >= 99.5
                  ? "Você se pagou primeiro este mês. O ouro flui para quem o guarda."
                  : `Faltam ${brl(Math.max(0, titheTarget - month.tithe))} para cumprir a primeira lei.`}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "mt-4",
                  tithePercent >= 99.5
                    ? "border-success/40 text-success"
                    : "border-warning/40 text-warning",
                )}
              >
                <ShieldCheck className="mr-1 h-3 w-3" />
                {tithePercent >= 99.5 ? "Lei cumprida" : "Em progresso"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CardIcon className="h-4 w-4 text-primary" />
              Cartões e faturas
            </CardTitle>
            <Link to="/cartoes" className="shrink-0 text-xs text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {cardStats.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
            )}
            {cardStats.map((c) => (
              <div key={c.id} className="min-w-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    <span className="font-semibold text-gold">{brl(c.committed)}</span> /{" "}
                    {brl(c.limit)}
                  </span>
                </div>
                <Progress value={Math.min(100, c.usage)} className="mt-1.5 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Disponível {brl(c.available)}
                  {c.dueIn !== null && ` · vence em ${c.dueIn} dia${c.dueIn === 1 ? "" : "s"}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className="h-4 w-4 text-primary" />
              Dívidas
            </CardTitle>
            <Link to="/dividas" className="shrink-0 text-xs text-primary hover:underline">
              Gerenciar
            </Link>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-extrabold text-destructive">
              {brl(debts.remaining)}
            </p>
            <p className="text-xs text-muted-foreground">
              {debts.progress.toFixed(0)}% quitado ·{" "}
              {debts.monthsToFreedom > 0 ? `${debts.monthsToFreedom} meses restantes` : "sem dívidas"}
            </p>
            <Progress value={Math.min(100, debts.progress)} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <CardTitle className="text-base">Regra 70/20/10 do mês</CardTitle>
          <Link to="/orcamento" className="shrink-0 text-xs text-primary hover:underline">
            Ajustar
          </Link>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => {
            const meta = PILLARS.find((x) => x.id === p.id)!;
            return (
              <div key={p.id} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{meta.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      p.percent > 100 ? "text-destructive" : "text-success",
                    )}
                  >
                    {p.percent.toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(100, p.percent)} className="mt-2 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {brl(p.used)} de {brl(p.target)}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-primary/25">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Quote className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Sabedoria do dia
            </p>
            <p className="mt-1 font-display text-lg leading-snug">"{quote}"</p>
            <p className="mt-1 text-xs text-muted-foreground">
              — O Homem Mais Rico da Babilônia
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0 self-start">
          <CardHeader>
            <CardTitle className="text-base">Trilha da Jornada</CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyTrail stops={trail} />
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <FreedomMeter months={freedomMonths} wealth={wealth} />
          <div className="grid gap-3">
            {vaults.map((item, i) => (
              <VaultJar key={item.id} item={item} delay={i * 0.08} />
            ))}
            {vaults.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  Crie um cofre no Multiplicador para ver seus sonhos enchendo de ouro.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <CardTitle className="text-base">Últimas moedas registradas</CardTitle>
          <Link to="/transacoes" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.map((t) => (
            <div
              key={t.id}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-3",
                t.savedTenPercent && "border-primary/40 bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  t.type === "entrada"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                {t.type === "entrada" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  <span className="truncate">{t.title}</span>
                  {t.savedTenPercent && <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.category} · {PAYMENT_LABELS[t.method]} · {formatDate(t.date)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  t.type === "entrada" ? "text-success" : "text-destructive",
                )}
              >
                {t.type === "entrada" ? "+" : "−"}
                {brl(t.amount)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "success" | "destructive";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-display text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
