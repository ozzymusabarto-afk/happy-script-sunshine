import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { brl } from "@/lib/aurin";
import { cn } from "@/lib/utils";
import { budgetRows, currentMonthKey, monthTotals, useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Controle de Gastos — A Regra dos 90% | AURIN" },
      {
        name: "description",
        content:
          "Distribua no máximo 90% da sua renda entre as categorias e mantenha o dízimo intacto.",
      },
      { property: "og:title", content: "Controle de Gastos — A Regra dos 90% | AURIN" },
      {
        property: "og:description",
        content: "Limites por categoria calculados sobre 90% da renda, com alertas visuais.",
      },
    ],
  }),
  component: BudgetPage,
});

function toneFor(percent: number) {
  if (percent > 90) return "destructive" as const;
  if (percent >= 70) return "warning" as const;
  return "success" as const;
}

function BudgetPage() {
  const transactions = useAurinStore((s) => s.transactions);
  const split = useAurinStore((s) => s.budgetSplit);
  const setBudgetSplit = useAurinStore((s) => s.setBudgetSplit);

  const key = currentMonthKey();
  const month = useMemo(() => monthTotals(transactions, key), [transactions, key]);
  const rows = useMemo(() => budgetRows(transactions, key, split), [transactions, key, split]);

  const ceiling = month.income * 0.9;
  const totalSplit = Object.values(split).reduce((a, b) => a + b, 0);
  const usedPercent = ceiling > 0 ? (month.expense / ceiling) * 100 : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          Controle de Gastos — A Regra dos 90%
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          "Não confunda desejos necessários com despesas necessárias." Seus gastos nunca devem
          ultrapassar 90% do ouro que entra.
        </p>
      </header>

      <Card className="border-primary/30">
        <CardContent className="grid gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Teto de gastos do mês (90% da renda)
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-gold">{brl(ceiling)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Renda do mês: {brl(month.income)} · Já gasto: {brl(month.expense)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Uso do teto</span>
              <span
                className={cn(
                  "font-semibold",
                  usedPercent > 90
                    ? "text-destructive"
                    : usedPercent >= 70
                      ? "text-warning"
                      : "text-success",
                )}
              >
                {usedPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={Math.min(100, usedPercent)} className="mt-2 h-3" />
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              {usedPercent > 90 ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              )}
              {usedPercent > 90
                ? "Sua bolsa está vazando. Reduza gastos para proteger o dízimo de Arkad."
                : "Seus gastos estão dentro do limite babilônico. Continue assim."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-primary" />
            Distribuição por categoria
          </CardTitle>
          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              totalSplit === 100 ? "text-muted-foreground" : "text-warning",
            )}
          >
            {totalSplit}% do teto alocado
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
                    <span
                      className={cn(
                        "font-semibold",
                        tone === "destructive"
                          ? "text-destructive"
                          : tone === "warning"
                            ? "text-warning"
                            : "text-success",
                      )}
                    >
                      {brl(row.spent)}
                    </span>
                    <span className="text-muted-foreground"> / {brl(row.limit)}</span>
                  </p>
                </div>

                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      tone === "destructive"
                        ? "bg-destructive"
                        : tone === "warning"
                          ? "bg-warning"
                          : "bg-success",
                    )}
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
                    aria-label={`Percentual do teto para ${row.category}`}
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
    </div>
  );
}
