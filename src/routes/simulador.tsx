import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Compass, Crown, HeartHandshake, Sparkles, TrendingUp } from "lucide-react";

import { CurrencyInput } from "@/components/currency-input";
import { PremiumGate } from "@/components/premium-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAurinHydrated } from "@/hooks/use-aurin-hydrated";
import { TREASURY_GOAL_ID, brl } from "@/lib/aurin";
import { daysOfFreedom, formatDays, futureValue, lifeCostPerDay } from "@/lib/impact";
import { cn } from "@/lib/utils";
import { debtSummary, monthTotals, currentMonthKey, useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador de Decisões | AURIN" },
      {
        name: "description",
        content:
          "Antes de gastar, veja quanto tempo de paz aquela escolha custa e o que ela valeria no futuro.",
      },
      { property: "og:title", content: "Simulador de Decisões | AURIN" },
      {
        property: "og:description",
        content: "Enxergue o impacto de uma compra antes de fazê-la.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  const hydrated = useAurinHydrated();
  const transactions = useAurinStore((s) => s.transactions);
  const debts = useAurinStore((s) => s.debts);
  const goals = useAurinStore((s) => s.goals);

  const [amount, setAmount] = useState(0);
  const [years, setYears] = useState(10);

  const perDay = useMemo(() => lifeCostPerDay(transactions), [transactions]);
  const freedom = useMemo(() => daysOfFreedom(amount, transactions), [amount, transactions]);
  const future = useMemo(() => futureValue(amount, years), [amount, years]);
  const summary = useMemo(() => debtSummary(debts), [debts]);
  const month = useMemo(() => monthTotals(transactions, currentMonthKey()), [transactions]);

  const dream = goals.find((g) => g.id !== TREASURY_GOAL_ID) ?? goals[0];
  const dreamShare = dream && dream.target > 0 ? Math.min(100, (amount / dream.target) * 100) : 0;

  const verdict = useMemo(() => {
    if (amount <= 0) return null;
    const days = freedom.days;
    if (days < 2)
      return {
        tone: "success" as const,
        title: "Escolha leve",
        text: "Isso quase não mexe no seu tempo de paz. Se te faz bem, aproveite sem culpa.",
      };
    if (days < 10)
      return {
        tone: "warn" as const,
        title: "Vale um respiro",
        text: "Custa alguns dias de paz. Espere 24 horas: se amanhã ainda fizer sentido, siga em frente.",
      };
    return {
      tone: "hold" as const,
      title: "Pesa no seu futuro",
      text: "Essa escolha compra muitos dias de tranquilidade. Talvez metade dela já te satisfaça.",
    };
  }, [amount, freedom.days]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
          <Crown className="h-3.5 w-3.5" /> Premium
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          Simulador de Decisões
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Antes de gastar, veja com carinho quanto tempo de paz aquela escolha custa — e o que ela
          poderia virar se ficasse com você.
        </p>
      </header>

      <PremiumGate
        feature="Simulador de Decisões"
        title="Veja o futuro antes de decidir"
        description="Descubra quantos dias de paz cada compra custa e o que ela valeria guardada."
        className="max-h-[560px]"
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Compass className="h-4 w-4 text-primary" /> O que você está pensando em gastar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="sim-amount">Valor da escolha</Label>
                <CurrencyInput id="sim-amount" value={amount} onValueChange={setAmount} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Olhando daqui a</span>
                  <span className="font-semibold text-gold">
                    {years} ano{years === 1 ? "" : "s"}
                  </span>
                </div>
                <Slider
                  value={[years]}
                  min={1}
                  max={30}
                  step={1}
                  className="mt-3"
                  onValueChange={([v]) => setYears(v)}
                  aria-label="Horizonte em anos"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Tempo de paz que isso custa"
              value={amount > 0 ? formatDays(freedom.days) : "—"}
              hint={`Seu dia de vida custa ${brl(perDay)}`}
            />
            <Metric
              label={`Se ficasse guardado por ${years} ano${years === 1 ? "" : "s"}`}
              value={amount > 0 ? brl(future) : "—"}
              hint="Moedas do Futuro trabalhando por você"
              tone="gold"
            />
            <Metric
              label={dream ? `Avanço em “${dream.name}”` : "Avanço no seu sonho"}
              value={amount > 0 ? `${dreamShare.toFixed(0)}%` : "—"}
              hint={dream ? `Meta de ${brl(dream.target)}` : "Crie um sonho para comparar"}
            />
            <Metric
              label="Se virasse Resgate de Paz"
              value={
                amount > 0 && summary.remaining > 0
                  ? `${Math.min(100, (amount / summary.remaining) * 100).toFixed(0)}% livre`
                  : "Você já está livre"
              }
              hint={summary.remaining > 0 ? `Faltam ${brl(summary.remaining)}` : "Nada te prende"}
              tone="success"
            />
          </div>

          {verdict && (
            <Card
              className={cn(
                "border",
                verdict.tone === "success" && "border-success/40 bg-success/[0.06]",
                verdict.tone === "warn" && "border-primary/40 bg-primary/[0.06]",
                verdict.tone === "hold" && "border-accent/40 bg-accent/[0.06]",
              )}
            >
              <CardContent className="flex gap-3 pt-6">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">{verdict.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{verdict.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sem julgamento: gastar também faz parte. O simulador só mostra o outro lado da
                    escolha.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartHandshake className="h-4 w-4 text-primary" /> Consultor de Paz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Advice
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                text={
                  month.expense > month.income
                    ? "Este mês suas escolhas passaram das entradas. Nada de culpa: escolha uma categoria e reduza só um pouco na próxima semana."
                    : "Seu mês está equilibrado. Se sobrar algo, mande direto para o cofre antes do fim do mês."
                }
              />
              <Advice
                icon={<Sparkles className="h-4 w-4 text-primary" />}
                text={
                  summary.remaining > 0
                    ? `Somando ${brl(Math.max(50, month.income * 0.05))} por mês ao seu Resgate de Paz, sua liberdade chega bem antes.`
                    : "Sem pesos te prendendo, cada real guardado agora é puro futuro."
                }
              />
              <Advice
                icon={<Compass className="h-4 w-4 text-primary" />}
                text={`Guardando ${brl(Math.max(100, month.income * 0.1))} por mês, em um ano você compra ${formatDays(
                  daysOfFreedom(Math.max(100, month.income * 0.1) * 12, transactions).days,
                )} de tranquilidade.`}
              />
            </CardContent>
          </Card>
        </div>
      </PremiumGate>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "gold" | "success";
}) {
  return (
    <Card>
      <CardContent className="min-w-0 pt-6">
        <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-display text-2xl font-bold",
            tone === "gold" && "text-gold",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Advice({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </p>
  );
}
