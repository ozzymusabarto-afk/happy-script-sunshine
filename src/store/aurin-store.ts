import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BADGES,
  BUDGET_SPLIT,
  EXPENSE_CATEGORIES,
  TREASURY_GOAL_ID,
  monthKey,
  type FixedAsset,
  type Goal,
  type Transaction,
} from "@/lib/aurin";
import { seedAssets, seedBadges, seedGoals, seedTransactions, seedXp } from "@/lib/seed-data";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export interface AurinState {
  transactions: Transaction[];
  goals: Goal[];
  assets: FixedAsset[];
  xp: number;
  badges: string[];
  budgetSplit: Record<string, number>;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  addAsset: (asset: Omit<FixedAsset, "id">) => void;
  removeAsset: (id: string) => void;
  setBudgetSplit: (category: string, percent: number) => void;
  resetToSeed: () => void;
}

const initial = {
  transactions: seedTransactions,
  goals: seedGoals,
  assets: seedAssets,
  xp: seedXp,
  badges: seedBadges,
  budgetSplit: { ...BUDGET_SPLIT },
};

export const useAurinStore = create<AurinState>()(
  persist(
    (set) => ({
      ...initial,

      addTransaction: (tx) =>
        set((state) => {
          const transaction: Transaction = { ...tx, id: uid() };
          let goals = state.goals;
          if (transaction.type === "entrada" && transaction.savedTenPercent) {
            const share = transaction.amount * 0.1;
            goals = state.goals.map((g) =>
              g.id === TREASURY_GOAL_ID ? { ...g, balance: g.balance + share } : g,
            );
          }
          return {
            transactions: [transaction, ...state.transactions],
            goals,
            xp: state.xp + 10 + (transaction.savedTenPercent ? 40 : 0),
          };
        }),

      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, { ...goal, id: uid() }], xp: state.xp + 25 })),

      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id || g.id === TREASURY_GOAL_ID) })),

      depositToGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, balance: g.balance + amount } : g)),
          xp: state.xp + 50,
        })),

      addAsset: (asset) => set((state) => ({ assets: [...state.assets, { ...asset, id: uid() }], xp: state.xp + 30 })),

      removeAsset: (id) => set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

      setBudgetSplit: (category, percent) =>
        set((state) => ({ budgetSplit: { ...state.budgetSplit, [category]: percent } })),

      resetToSeed: () => set({ ...initial }),
    }),
    { name: "aurin-store-v1" },
  ),
);

/* ---------------------------------- seletores --------------------------------- */

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export function monthTotals(transactions: Transaction[], key: string) {
  let income = 0;
  let expense = 0;
  let tithe = 0;
  for (const t of transactions) {
    if (monthKey(t.date) !== key) continue;
    if (t.type === "entrada") {
      income += t.amount;
      if (t.savedTenPercent) tithe += t.amount * 0.1;
    } else {
      expense += t.amount;
    }
  }
  return { income, expense, tithe, balance: income - expense };
}

export function totalWealth(goals: Goal[], assets: FixedAsset[]) {
  return (
    goals.reduce((sum, g) => sum + g.balance, 0) + assets.reduce((sum, a) => sum + a.value, 0)
  );
}

export function flowSeries(transactions: Transaction[], months = 6) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys.map((key) => {
    const { income, expense, tithe } = monthTotals(transactions, key);
    return { key, entrada: income, saida: expense, tesouro: tithe };
  });
}

export function categoryBreakdown(transactions: Transaction[], key: string) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "saida" || monthKey(t.date) !== key) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
}

export function budgetRows(
  transactions: Transaction[],
  key: string,
  split: Record<string, number>,
) {
  const { income } = monthTotals(transactions, key);
  const ceiling = income * 0.9;
  const spentByCategory = new Map(categoryBreakdown(transactions, key).map((c) => [c.category, c.value]));
  return EXPENSE_CATEGORIES.map((category) => {
    const limit = (ceiling * (split[category] ?? 0)) / 100;
    const spent = spentByCategory.get(category) ?? 0;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    return { category, limit, spent, percent };
  });
}

export function loggingStreak(transactions: Transaction[]) {
  const days = new Set(transactions.map((t) => t.date));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) streak++;
    else if (i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function earnedBadges(state: {
  transactions: Transaction[];
  goals: Goal[];
  assets: FixedAsset[];
  badges: string[];
}) {
  const key = currentMonthKey();
  const { income, expense, tithe } = monthTotals(state.transactions, key);
  const reserve = state.goals.find((g) => g.kind === "reserva");
  const avgExpense = expense || 1;
  const unlocked = new Set(state.badges);

  if (state.transactions.some((t) => t.savedTenPercent)) unlocked.add("primeira-moeda");
  if (reserve && reserve.balance >= avgExpense * 3) unlocked.add("escudo-babilonia");
  if (state.goals.some((g) => g.kind === "investimento" && g.balance > 0)) unlocked.add("multiplicador");
  if (loggingStreak(state.transactions) >= 7) unlocked.add("consistencia");
  if (income > 0 && tithe >= income * 0.1 - 0.01) unlocked.add("senhor-dizimo");
  if (state.assets.length > 0) unlocked.add("arquiteto-futuro");

  return BADGES.map((badge) => ({ ...badge, unlocked: unlocked.has(badge.id) }));
}
