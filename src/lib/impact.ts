import { monthKey, type Goal, type Transaction } from "@/lib/aurin";
import { CATEGORY_PILLAR } from "@/lib/aurin";

/** Taxa mensal padrão usada nas projeções (≈10% a.a.). */
export const DEFAULT_MONTHLY_RATE = 0.008;

export const HORIZONS = [1, 5, 10, 20] as const;

/** Valor futuro de um aporte único após `anos`, com juros compostos mensais. */
export function futureValue(amount: number, years: number, rate = DEFAULT_MONTHLY_RATE) {
  if (amount <= 0) return 0;
  return amount * Math.pow(1 + rate, years * 12);
}

/** Projeção do aporte em vários horizontes. */
export function futureHorizons(amount: number, rate = DEFAULT_MONTHLY_RATE) {
  return HORIZONS.map((years) => ({
    years,
    value: futureValue(amount, years, rate),
    growth: futureValue(amount, years, rate) - amount,
  }));
}

/**
 * Custo médio de um dia de vida, a partir das saídas do pilar "custo"
 * nos últimos `months` meses. Tem um piso para evitar divisão por zero.
 */
export function lifeCostPerDay(transactions: Transaction[], months = 3) {
  const keys = new Set<string>();
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  let total = 0;
  for (const t of transactions) {
    if (t.type !== "saida") continue;
    if (!keys.has(monthKey(t.date))) continue;
    if ((CATEGORY_PILLAR[t.category] ?? "custo") !== "custo") continue;
    total += t.amount;
  }
  const perDay = total / (months * 30);
  return perDay > 1 ? perDay : 50;
}

/** Quantos dias de liberdade um valor compra. */
export function daysOfFreedom(amount: number, transactions: Transaction[]) {
  const perDay = lifeCostPerDay(transactions);
  return { perDay, days: amount / perDay };
}

export interface DreamProgress {
  id: string;
  name: string;
  target: number;
  before: number;
  after: number;
  percentBefore: number;
  percentAfter: number;
  monthsSaved: number;
  remaining: number;
}

/**
 * Avanço causado por um aporte em um cofre: percentual antes/depois e
 * quantos meses de espera aquele valor eliminou (dado o ritmo mensal).
 */
export function dreamProgress(goal: Goal, amount: number, monthlyPace: number): DreamProgress {
  const after = goal.balance;
  const before = Math.max(0, after - amount);
  const target = goal.target > 0 ? goal.target : after || 1;
  const pace = monthlyPace > 0 ? monthlyPace : 0;
  return {
    id: goal.id,
    name: goal.name,
    target,
    before,
    after,
    percentBefore: Math.min(100, (before / target) * 100),
    percentAfter: Math.min(100, (after / target) * 100),
    monthsSaved: pace > 0 ? amount / pace : 0,
    remaining: Math.max(0, target - after),
  };
}

export const MILESTONES = [10, 25, 50, 75, 100] as const;

/** Maior marco (%) cruzado entre dois saldos de um cofre. */
export function milestoneCrossed(before: number, after: number, target: number): number | null {
  if (target <= 0) return null;
  const pb = (before / target) * 100;
  const pa = (after / target) * 100;
  let crossed: number | null = null;
  for (const m of MILESTONES) {
    if (pb < m && pa >= m) crossed = m;
  }
  return crossed;
}

/** Meses de liberdade que o patrimônio total já garante. */
export function monthsOfFreedom(wealth: number, transactions: Transaction[]) {
  const perDay = lifeCostPerDay(transactions);
  return wealth / (perDay * 30);
}

export function formatDays(days: number) {
  if (days >= 365) {
    const years = days / 365;
    return `${years.toFixed(years >= 10 ? 0 : 1)} ano${years >= 2 ? "s" : ""}`;
  }
  if (days >= 30) {
    const months = days / 30;
    return `${months.toFixed(months >= 10 ? 0 : 1)} mês${months >= 2 ? "es" : ""}`;
  }
  return `${Math.max(0, Math.round(days))} dia${Math.round(days) === 1 ? "" : "s"}`;
}

/**
 * "Paz de espírito": combina os dias de liberdade comprados por um valor com
 * o alívio de dívida que ele representa. Escala 0–100, sempre positiva.
 */
export function peaceGain(amount: number, transactions: Transaction[], debtRemaining = 0) {
  if (amount <= 0) return { points: 0, days: 0 };
  const { days } = daysOfFreedom(amount, transactions);
  const relief = debtRemaining > 0 ? Math.min(1, amount / debtRemaining) : 0;
  const points = Math.min(100, Math.round(days * 1.6 + relief * 45 + 4));
  return { points: Math.max(1, points), days };
}
