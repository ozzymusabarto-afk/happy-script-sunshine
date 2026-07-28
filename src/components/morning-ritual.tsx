import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, HandCoins, Sparkles, Sunrise, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { brl, TREASURY_GOAL_ID, type Goal } from "@/lib/aurin";
import { futureValue, monthsOfFreedom } from "@/lib/impact";
import { dailyLine, greeting, longDate } from "@/lib/tone";
import { cn } from "@/lib/utils";

interface Props {
  goals: Goal[];
  wealth: number;
  freedomMonths: number;
  titheDone: boolean;
  titheGap: number;
  debtRemaining: number;
  monthlyPace: number;
}

/**
 * Ritual matinal: acolhimento, clareza sobre o futuro e o progresso dos
 * sonhos — nunca cobranças. O saldo aparece como apoio, não como manchete.
 */
export function MorningRitual({
  goals,
  wealth,
  freedomMonths,
  titheDone,
  titheGap,
  debtRemaining,
  monthlyPace,
}: Props) {
  const dreams = useMemo(
    () => goals.filter((g) => g.id !== TREASURY_GOAL_ID && g.target > 0),
    [goals],
  );

  const dreamProgress = useMemo(() => {
    if (dreams.length === 0) return 0;
    const sum = dreams.reduce(
      (acc, g) => acc + Math.min(1, g.balance / (g.target || 1)),
      0,
    );
    return (sum / dreams.length) * 100;
  }, [dreams]);

  const future = futureValue(wealth, 10);

  const nextStep = useMemo(() => {
    if (!titheDone && titheGap > 0) {
      return {
        icon: <Sparkles className="h-4 w-4" />,
        title: "Guarde seu ouro do dia",
        detail: `Faltam ${brl(titheGap)} para completar os 10% deste mês.`,
        to: "/transacoes" as const,
        cta: "Registrar",
      };
    }
    const closest = [...dreams]
      .filter((g) => g.balance < g.target)
      .sort((a, b) => b.balance / b.target - a.balance / a.target)[0];
    if (closest) {
      return {
        icon: <Target className="h-4 w-4" />,
        title: `Aproxime "${closest.name}"`,
        detail: `Faltam ${brl(Math.max(0, closest.target - closest.balance))} para esse sonho virar realidade.`,
        to: "/multiplicador" as const,
        cta: "Depositar",
      };
    }
    if (debtRemaining > 0) {
      return {
        icon: <HandCoins className="h-4 w-4" />,
        title: "Solte mais uma corrente",
        detail: "Um pagamento hoje antecipa a sua data de liberdade.",
        to: "/dividas" as const,
        cta: "Ver rota",
      };
    }
    return {
      icon: <Sparkles className="h-4 w-4" />,
      title: "Você está em dia",
      detail: "Nada urgente hoje. Aproveite — seu ouro segue trabalhando.",
      to: "/jornada" as const,
      cta: "Ver jornada",
    };
  }, [titheDone, titheGap, dreams, debtRemaining]);

  const focus = useMemo(
    () =>
      [...dreams]
        .filter((g) => g.balance < g.target)
        .sort((a, b) => b.balance / b.target - a.balance / a.target)
        .slice(0, 3),
    [dreams],
  );

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-panel sm:p-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-temple)" }}
      />
      <div className="relative">
        <div className="reveal-step flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
          <Sunrise className="h-3.5 w-3.5" />
          {greeting()}
        </div>

        <h1
          className="reveal-step mt-3 max-w-2xl font-display text-2xl font-extrabold leading-tight sm:text-3xl"
          style={{ animationDelay: "0.06s" }}
        >
          {dailyLine()}
        </h1>
        <p
          className="reveal-step mt-2 text-sm text-muted-foreground"
          style={{ animationDelay: "0.1s" }}
        >
          {longDate()}
        </p>

        <div
          className="reveal-step mt-7 grid gap-4 sm:grid-cols-3"
          style={{ animationDelay: "0.16s" }}
        >
          <FutureTile
            label="Seus sonhos hoje"
            value={`${dreamProgress.toFixed(0)}%`}
            hint={
              dreams.length > 0
                ? `Média de avanço entre ${dreams.length} sonho${dreams.length === 1 ? "" : "s"}.`
                : "Crie um cofre para começar a ver o futuro se formando."
            }
            highlight
          />
          <FutureTile
            label="Em 10 anos isso vira"
            value={brl(future)}
            hint="Se o que já é seu apenas continuar rendendo."
          />
          <FutureTile
            label="Tranquilidade garantida"
            value={
              freedomMonths >= 12
                ? `${(freedomMonths / 12).toFixed(1)} anos`
                : `${Math.max(0, freedomMonths).toFixed(1)} meses`
            }
            hint="Tempo que você viveria sem depender de mais nada."
          />
        </div>

        <div
          className="reveal-step mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
          style={{ animationDelay: "0.22s" }}
        >
          <Card className="min-w-0 border-primary/25 bg-background/50">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Sonhos em foco
              </p>
              <div className="mt-4 space-y-4">
                {focus.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Todos os sonhos atuais já estão completos. Que tal sonhar mais alto?
                  </p>
                )}
                {focus.map((g) => {
                  const percent = Math.min(100, (g.balance / (g.target || 1)) * 100);
                  const missing = Math.max(0, g.target - g.balance);
                  const steps = monthlyPace > 0 ? Math.ceil(missing / monthlyPace) : null;
                  return (
                    <div key={g.id} className="min-w-0">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                        <span className="truncate text-sm font-medium">{g.name}</span>
                        <span className="shrink-0 font-display text-sm font-bold text-gold">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {steps !== null && steps > 0
                          ? `Faltam ${steps} aporte${steps === 1 ? "" : "s"} no seu ritmo atual.`
                          : "Praticamente lá — mais um gesto e é seu."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-primary/30 bg-background/50">
            <CardContent className="flex h-full flex-col pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Um passo hoje
              </p>
              <div className="mt-4 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  {nextStep.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-base font-bold">{nextStep.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{nextStep.detail}</p>
                </div>
              </div>
              <Link
                to={nextStep.to}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10 hover:shadow-gold"
              >
                {nextStep.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <p className="mt-auto pt-5 text-xs text-muted-foreground">
                O que já é seu: <span className="font-semibold text-foreground">{brl(wealth)}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function FutureTile({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5",
        highlight
          ? "border-primary/40 bg-primary/5 hover:shadow-gold"
          : "border-border bg-background/50",
      )}
    >
      <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-extrabold text-gold">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
