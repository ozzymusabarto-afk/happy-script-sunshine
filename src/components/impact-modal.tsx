import { useEffect, useMemo, useState } from "react";
import { Coins, Flame, Quote, Sparkles, Unlink } from "lucide-react";

import { GoldCounter, usePrefersReducedMotion } from "@/components/gold-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { brl, quoteOfTheDay, TREASURY_GOAL_ID } from "@/lib/aurin";
import {
  daysOfFreedom,
  dreamProgress,
  formatDays,
  futureValue,
  milestoneCrossed,
  peaceGain,
} from "@/lib/impact";
import { mentorPraise, peaceLine } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { currentMonthKey, monthTotals, useAurinStore } from "@/store/aurin-store";

const KIND_COPY: Record<string, { eyebrow: string; headline: string }> = {
  tesouro: { eyebrow: "Você se pagou primeiro", headline: "Ouro guardado no Tesouro" },
  cofre: { eyebrow: "Um sonho avançou", headline: "Ouro depositado no cofre" },
  divida: { eyebrow: "Corrente enfraquecida", headline: "Paz reconquistada" },
  fatura: { eyebrow: "Fatura dominada", headline: "Você quitou a fatura" },
};

/** Celebração motivacional exibida a cada valor guardado ou dívida abatida. */
export function ImpactModal() {
  const celebration = useAurinStore((s) => s.celebration);
  const dismiss = useAurinStore((s) => s.dismissCelebration);
  const profileName = useAurinStore((s) => s.profile.name);
  const goals = useAurinStore((s) => s.goals);
  const transactions = useAurinStore((s) => s.transactions);
  const debts = useAurinStore((s) => s.debts);
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!celebration) return;
    setStep(reduced ? 3 : 0);
    if (reduced) return;
    const timers = [1, 2, 3].map((i) => window.setTimeout(() => setStep(i), 320 * i));
    return () => timers.forEach(window.clearTimeout);
  }, [celebration, reduced]);

  const monthlyPace = useMemo(() => {
    const t = monthTotals(transactions, currentMonthKey());
    return t.tithe > 0 ? t.tithe : t.income * 0.1;
  }, [transactions]);

  if (!celebration) return null;

  const copy = KIND_COPY[celebration.kind] ?? KIND_COPY.tesouro;
  const goal = goals.find((g) => g.id === celebration.goalId);

  const isDebt = celebration.kind === "divida";
  const amount = celebration.amount;

  const in10 = futureValue(amount, 10);
  const freedom = daysOfFreedom(amount, transactions);
  const progress = goal ? dreamProgress(goal, amount, monthlyPace) : null;
  const milestone =
    goal && celebration.before !== undefined && celebration.after !== undefined
      ? milestoneCrossed(celebration.before, celebration.after, goal.target)
      : null;

  const debtRemaining = debts.reduce((sum, d) => sum + Math.max(0, d.principal - d.paid), 0);
  const peace = peaceGain(amount, transactions, debtRemaining);
  const encouragement = peaceLine(
    (celebration.id.charCodeAt(celebration.id.length - 1) % 100) / 100,
  );

  const praise = mentorPraise({
    amount,
    days: freedom.days,
    future: isDebt ? amount * 0.4 : in10,
    money: brl,
    seed: (celebration.id.charCodeAt(0) % 100) / 100,
    name: profileName,
  });

  const nextDream = goals
    .filter((g) => g.id !== TREASURY_GOAL_ID && g.balance < g.target)
    .sort((a, b) => b.balance / b.target - a.balance / a.target)[0];

  return (
    <Dialog open onOpenChange={(o) => !o && dismiss()}>
      <DialogContent
        className="max-w-md overflow-hidden border-primary/40 p-0"
      >
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--gradient-temple)" }}
          />
          {!reduced && (
            <div className="pointer-events-none absolute inset-x-0 top-16 h-40">
              {[12, 28, 44, 60, 76, 88].map((left, i) => (
                <span
                  key={left}
                  className="gold-spark absolute h-1.5 w-1.5 rounded-full bg-primary"
                  style={{ left: `${left}%`, animationDelay: `${i * 0.22}s` }}
                />
              ))}
            </div>
          )}

          <div className="relative p-6 text-center">
            <Badge variant="outline" className="border-primary/40 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              {copy.eyebrow}
            </Badge>

            <DialogTitle className="sr-only">{copy.headline}</DialogTitle>

            <p className="mt-4 font-display text-4xl font-extrabold text-gold">
              <GoldCounter value={amount} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDebt ? `abatidos de ${celebration.title}` : `guardados em ${celebration.title}`}
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/90">
              {praise}
            </p>

            <div className="mt-6 space-y-2.5 text-left">
              <ImpactCard
                show={step >= 1}
                delay={0}
                icon={<Coins className="h-4 w-4" />}
                label={isDebt ? "Juros que você deixou de pagar" : "Em 10 anos isso vira"}
                value={brl(isDebt ? amount * 0.4 : in10)}
                hint={
                  isDebt
                    ? "Cada real pago hoje mata juros de amanhã."
                    : `Crescimento de ${brl(in10 - amount)} sem você mover um dedo.`
                }
              />
              <ImpactCard
                show={step >= 2}
                delay={0.08}
                icon={<Flame className="h-4 w-4" />}
                label="Dias de liberdade comprados"
                value={formatDays(freedom.days)}
                hint={`Seu dia de vida custa ${brl(freedom.perDay)}.`}
              />
              {progress ? (
                <ImpactCard
                  show={step >= 3}
                  delay={0.16}
                  icon={<Sparkles className="h-4 w-4" />}
                  label={`Sonho "${progress.name}"`}
                  value={`${progress.percentAfter.toFixed(0)}%`}
                  hint={
                    progress.monthsSaved >= 0.1
                      ? `Você antecipou esse sonho em ${progress.monthsSaved.toFixed(1)} mês(es). Faltam ${brl(progress.remaining)}.`
                      : `Faltam ${brl(progress.remaining)} para realizar.`
                  }
                >
                  <Progress value={progress.percentAfter} className="mt-2 h-2" />
                </ImpactCard>
              ) : (
                <ImpactCard
                  show={step >= 3}
                  delay={0.16}
                  icon={<Unlink className="h-4 w-4" />}
                  label={celebration.cleared ? "Corrente rompida" : "Próximo sonho na fila"}
                  value={
                    celebration.cleared
                      ? "Resgate concluído"
                      : (nextDream?.name ?? "Crie um cofre novo")
                  }
                  hint={
                    celebration.cleared
                      ? "Esse credor não manda mais no seu futuro."
                      : "Cada pagamento libera ouro para o seu tesouro."
                  }
                />
              )}
            </div>

            <div
              className={cn(
                "mt-4 rounded-2xl border border-primary/35 bg-primary/10 p-4 text-left transition-opacity",
                step >= 1 ? "reveal-step opacity-100" : "opacity-0",
              )}
              style={{ animationDelay: "0.24s" }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                <p className="truncate font-display text-sm font-bold text-primary">
                  {encouragement}
                </p>
                <span className="shrink-0 font-display text-sm font-bold text-gold">
                  +{peace.points}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-700"
                  style={{ width: `${peace.points}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Índice de paz de espírito conquistado com este gesto.
              </p>
            </div>

            {milestone && (
              <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                Marco de {milestone}% alcançado no cofre {goal?.name}!
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 text-left text-xs text-muted-foreground">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>"{quoteOfTheDay()}"</span>
            </p>

            <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                +{celebration.xpGained} XP
              </Badge>
              <Button onClick={dismiss} className="w-full">
                Continuar a jornada
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImpactCard({
  show,
  delay,
  icon,
  label,
  value,
  hint,
  children,
}: {
  show: boolean;
  delay: number;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-secondary/40 p-3 transition-opacity",
        show ? "reveal-step opacity-100" : "opacity-0",
      )}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden={!show}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <span className="truncate text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="shrink-0 font-display text-sm font-bold text-gold">{value}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}
