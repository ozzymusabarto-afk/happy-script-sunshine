import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, RotateCcw, Scale, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { PILLARS, brl, type PillarId } from "@/lib/aurin";
import {
  TONE_BG,
  TONE_LABEL,
  TONE_TEXT,
  monthMood,
  pillarMessage,
  pillarTone,
} from "@/lib/tone";
import { cn } from "@/lib/utils";
import {
  budgetRows,
  currentMonthKey,
  monthTotals,
  pillarUsage,
  useAurinStore,
} from "@/store/aurin-store";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento 70/20/10 | AURIN" },
      {
        name: "description",
        content:
          "Divida sua renda em 70% custo de vida, 20% reservas e dívidas e 10% ouro, com alertas por pilar e categoria.",
      },
      { property: "og:title", content: "Orçamento 70/20/10 | AURIN" },
      {
        property: "og:description",
        content: "Três pilares babilônicos para manter seus gastos no lugar certo.",
      },
    ],
  }),
  component: BudgetPage,
});

const toneFor = pillarTone;
const toneText = TONE_TEXT;
const toneBg = TONE_BG;

function BudgetPage() {
  const transactions = useAurinStore((s) => s.transactions);
  const split = useAurinStore((s) => s.budgetSplit);
  const pillarSplit = useAurinStore((s) => s.pillarSplit);
  const setBudgetSplit = useAurinStore((s) => s.setBudgetSplit);
  const setPillarSplit = useAurinStore((s) => s.setPillarSplit);
  const resetPillarSplit = useAurinStore((s) => s.resetPillarSplit);

  const key = currentMonthKey();
  const month = useMemo(() => monthTotals(transactions, key), [transactions, key]);
  const pillars = useMemo(
    () => pillarUsage(transactions, key, pillarSplit, month.tithe),
    [transactions, key, pillarSplit, month.tithe],
  );

  const costCeiling = (month.income * pillarSplit.custo) / 100;
  const rows = useMemo(
    () => budgetRows(transactions, key, split, costCeiling),
    [transactions, key, split, costCeiling],
  );

  const totalSplit = Object.values(split).reduce((a, b) => a + b, 0);
  const isDefault = pillarSplit.custo === 70 && pillarSplit.reserva === 20 && pillarSplit.ouro === 10;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          Seu ritmo do mês — 70/20/10
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui não há cobrança: só clareza. Cada moeda que entra tem um lugar combinado, e sempre
          dá para reencontrar o ritmo.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {PILLARS.map((pillar) => {
          const data = pillars.find((p) => p.id === pillar.id)!;
          const tone = toneFor(data.percent);
          return (
            <Card key={pillar.id} className="border-border/70">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold">{pillar.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {pillarSplit[pillar.id as PillarId]}% da renda
                    </p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-semibold", toneText[tone])}>
                    {TONE_LABEL[tone]}
                  </span>
                </div>

                <p className="mt-4 font-display text-2xl font-extrabold text-gold">
                  {brl(data.target)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {brl(data.used)} usados · {data.percent.toFixed(0)}% do combinado
                </p>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", toneBg[tone])}
                    style={{ width: `${Math.min(100, data.percent)}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {pillarMessage(tone, pillar.label, data.remaining, brl, pillar.id === "ouro")}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground/80">{pillar.description}</p>

                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <Slider
                    value={[pillarSplit[pillar.id as PillarId]]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => setPillarSplit(pillar.id as PillarId, v)}
                    aria-label={`Percentual do pilar ${pillar.label}`}
                  />
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    {pillarSplit[pillar.id as PillarId]}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30">
        <CardContent className="grid gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              O que entrou este mês
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-gold">
              {brl(month.income)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Suas escolhas somaram {brl(month.expense)} e seu ouro cresceu {brl(month.tithe)} este
              mês.
            </p>
            {!isDefault && (
              <Button variant="outline" size="sm" className="mt-4" onClick={resetPillarSplit}>
                <RotateCcw className="h-3.5 w-3.5" />
                Voltar ao padrão 70/20/10
              </Button>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            {pillars.map((p) => {
              const pillar = PILLARS.find((x) => x.id === p.id)!;
              const tone = toneFor(p.percent);
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">{pillar.label}</span>
                    <span className={cn("shrink-0 font-semibold", toneText[tone])}>
                      {brl(p.used)} / {brl(p.target)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, p.percent)} className="mt-1.5 h-2" />
                </div>
              );
            })}
            <p className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
              {pillars.some((p) => p.percent > 100) ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              )}
              {monthMood(pillars.some((p) => p.percent > 100), month.tithe > 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-primary" />
            Onde a vida acontece
          </CardTitle>
          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              totalSplit === 100 ? "text-muted-foreground" : "text-warning",
            )}
          >
            {totalSplit}% dos {pillarSplit.custo}% alocados
          </span>
        </CardHeader>
        <CardContent className="space-y-6">
          {rows.map((row) => {
            const tone = toneFor(row.percent);
            return (
              <div key={row.category} className="min-w-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="truncate text-sm font-medium">{row.category}</p>
                  <p className="shrink-0 text-sm">
                    <span className={cn("font-semibold", toneText[tone])}>{brl(row.spent)}</span>
                    <span className="text-muted-foreground"> / {brl(row.limit)}</span>
                  </p>
                </div>

                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full transition-all", toneBg[tone])}
                    style={{ width: `${Math.min(100, row.percent)}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <Slider
                    value={[split[row.category] ?? 0]}
                    min={0}
                    max={60}
                    step={1}
                    onValueChange={([v]) => setBudgetSplit(row.category, v)}
                    aria-label={`Percentual do custo de vida para ${row.category}`}
                  />
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                    {split[row.category] ?? 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        O pilar Reservas & Resgate de Paz é o que acelera a sua libertação — acompanhe na{" "}
        <Link to="/libertacao" className="text-primary underline-offset-4 hover:underline">
          Plano de Libertação
        </Link>
        .
      </p>
    </div>
  );
}
