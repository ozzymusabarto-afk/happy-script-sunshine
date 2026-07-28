import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  BADGES,
  BUDGET_SPLIT,
  CATEGORY_PILLAR,
  COST_CATEGORIES,
  DEFAULT_PILLAR_SPLIT,
  EMPTY_PROFILE,
  TREASURY_GOAL_ID,
  addMonthsIso,
  clampDay,
  currentInvoiceKey,
  invoiceCycleFor,
  monthKey,
  type CreditCard,
  type Debt,
  type FixedAsset,
  type Goal,
  type PillarId,
  type Profile,
  type Recurring,
  type Transaction,
} from "@/lib/aurin";
import type { PlanId } from "@/lib/plan";
import {
  seedAssets,
  seedBadges,
  seedCards,
  seedDebts,
  seedGoals,
  seedTransactions,
  seedXp,
} from "@/lib/seed-data";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export type NewTransaction = Omit<Transaction, "id"> & { installments?: number };

export type CelebrationKind = "tesouro" | "cofre" | "divida" | "fatura";

export interface Celebration {
  id: string;
  kind: CelebrationKind;
  amount: number;
  title: string;
  goalId?: string;
  before?: number;
  after?: number;
  xpGained: number;
  cleared?: boolean;
}

export interface OnboardingPayload {
  name: string;
  monthlyIncome: number;
  dreamName: string;
  dreamTarget: number;
  dreamYears: number;
  startingBalance: number;
}

export interface SecuritySettings {
  /** Hash PBKDF2 do PIN — o PIN em si nunca é guardado. */
  pinHash: string | null;
  salt: string | null;
  biometricId: string | null;
  /** 0 = pede sempre ao abrir. */
  autoLockMinutes: number;
}

export interface ReminderSettings {
  enabled: boolean;
  /** "HH:MM" */
  time: string;
  lastShown: string | null;
}

export interface AurinState {
  hasOnboarded: boolean;
  plan: PlanId;
  profile: Profile;
  customCategories: string[];
  recurring: Recurring[];
  transactions: Transaction[];
  goals: Goal[];
  assets: FixedAsset[];
  cards: CreditCard[];
  debts: Debt[];
  paidInvoices: string[];
  xp: number;
  badges: string[];
  budgetSplit: Record<string, number>;
  pillarSplit: Record<PillarId, number>;
  celebration: Celebration | null;
  celebrationsEnabled: boolean;
  security: SecuritySettings;
  reminder: ReminderSettings;
  lastBackupAt: string | null;
  dismissCelebration: () => void;
  setCelebrationsEnabled: (enabled: boolean) => void;
  setSecurity: (patch: Partial<SecuritySettings>) => void;
  disableLock: () => void;
  setReminder: (patch: Partial<ReminderSettings>) => void;
  markBackup: () => void;
  setPlan: (plan: PlanId) => void;
  setProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: (payload: OnboardingPayload) => void;
  skipOnboarding: () => void;
  addCustomCategory: (name: string) => void;
  removeCustomCategory: (name: string) => void;
  addRecurring: (item: Omit<Recurring, "id" | "lastApplied">) => void;
  removeRecurring: (id: string) => void;
  applyRecurring: () => number;
  addTransaction: (tx: NewTransaction) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  addAsset: (asset: Omit<FixedAsset, "id">) => void;
  removeAsset: (id: string) => void;
  addCard: (card: Omit<CreditCard, "id">) => void;
  updateCard: (id: string, patch: Partial<CreditCard>) => void;
  removeCard: (id: string) => void;
  payInvoice: (cardId: string, key: string) => void;
  addDebt: (debt: Omit<Debt, "id" | "paid" | "createdAt"> & { paid?: number }) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  payDebt: (id: string, amount: number) => void;
  removeDebt: (id: string) => void;
  setBudgetSplit: (category: string, percent: number) => void;
  setPillarSplit: (pillar: PillarId, percent: number) => void;
  resetPillarSplit: () => void;
  loadDemoData: () => void;
  clearAll: () => void;
  importState: (data: Partial<AurinState>) => void;
  resetToSeed: () => void;
}

export const emptyTreasury = (): Goal => ({
  id: TREASURY_GOAL_ID,
  name: "Tesouro Pessoal (Dízimo de Arkad)",
  target: 0,
  balance: 0,
  kind: "investimento",
});

/** Estado de quem está começando agora: tudo vazio, pronto para digitar. */
const emptyState = () => ({
  hasOnboarded: false,
  plan: "free" as PlanId,
  profile: { ...EMPTY_PROFILE },
  customCategories: [] as string[],
  recurring: [] as Recurring[],
  transactions: [] as Transaction[],
  goals: [emptyTreasury()],
  assets: [] as FixedAsset[],
  cards: [] as CreditCard[],
  debts: [] as Debt[],
  paidInvoices: [] as string[],
  xp: 0,
  badges: [] as string[],
  budgetSplit: { ...BUDGET_SPLIT },
  pillarSplit: { ...DEFAULT_PILLAR_SPLIT },
  celebration: null as Celebration | null,
  celebrationsEnabled: true,
  security: {
    pinHash: null,
    salt: null,
    biometricId: null,
    autoLockMinutes: 0,
  } as SecuritySettings,
  reminder: { enabled: false, time: "08:00", lastShown: null } as ReminderSettings,
  lastBackupAt: null as string | null,
});

/** Conteúdo de demonstração — só entra quando o usuário pede. */
const demoState = () => ({
  ...emptyState(),
  hasOnboarded: true,
  profile: {
    name: "Explorador",
    monthlyIncome: 8200,
    dreamName: "Liberdade Financeira",
    dreamTarget: 500000,
    dreamYears: 15,
  },
  transactions: seedTransactions,
  goals: seedGoals,
  assets: seedAssets,
  cards: seedCards,
  debts: seedDebts,
  xp: seedXp,
  badges: seedBadges,
});

const initial = emptyState();


function expandInstallments(tx: NewTransaction, cards: CreditCard[]): Transaction[] {
  const count = Math.max(1, Math.floor(tx.installments ?? 1));
  const card = cards.find((c) => c.id === tx.cardId);
  if (count <= 1 || tx.method !== "cartao" || !card) {
    const { installments: _drop, ...rest } = tx;
    return [{ ...rest, id: uid() }];
  }
  const groupId = uid();
  const share = Math.round((tx.amount / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => ({
    ...tx,
    id: uid(),
    title: `${tx.title} (${i + 1}/${count})`,
    amount: i === count - 1 ? Math.round((tx.amount - share * (count - 1)) * 100) / 100 : share,
    date: addMonthsIso(tx.date, i),
    groupId,
    installments: count,
    installmentIndex: i + 1,
    savedTenPercent: false,
  }));
}

export const useAurinStore = create<AurinState>()(
  persist(
    (set, get) => ({
      ...initial,

      setPlan: (plan) => set({ plan }),

      setProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),

      completeOnboarding: (payload) =>
        set((state) => {
          const goals = state.goals.map((g) =>
            g.id === TREASURY_GOAL_ID
              ? {
                  ...g,
                  balance: payload.startingBalance,
                  target: payload.dreamTarget > 0 ? payload.dreamTarget : g.target,
                }
              : g,
          );
          if (payload.dreamName.trim() && payload.dreamTarget > 0) {
            goals.push({
              id: uid(),
              name: payload.dreamName.trim(),
              target: payload.dreamTarget,
              balance: 0,
              kind: "outro",
            });
          }
          return {
            hasOnboarded: true,
            profile: {
              name: payload.name.trim(),
              monthlyIncome: payload.monthlyIncome,
              dreamName: payload.dreamName.trim(),
              dreamTarget: payload.dreamTarget,
              dreamYears: payload.dreamYears,
            },
            goals,
            xp: state.xp + 50,
          };
        }),

      skipOnboarding: () => set({ hasOnboarded: true }),

      addCustomCategory: (name) =>
        set((state) => {
          const clean = name.trim().slice(0, 30);
          if (!clean || state.customCategories.includes(clean)) return state;
          return { customCategories: [...state.customCategories, clean] };
        }),

      removeCustomCategory: (name) =>
        set((state) => ({ customCategories: state.customCategories.filter((c) => c !== name) })),

      addRecurring: (item) =>
        set((state) => ({ recurring: [...state.recurring, { ...item, id: uid() }] })),

      removeRecurring: (id) =>
        set((state) => ({ recurring: state.recurring.filter((r) => r.id !== id) })),

      applyRecurring: () => {
        const state = get();
        const key = new Date().toISOString().slice(0, 7);
        const [y, m] = key.split("-").map(Number);
        const pending = state.recurring.filter((r) => r.lastApplied !== key);
        if (!pending.length) return 0;
        const created: Transaction[] = pending.map((r) => ({
          id: uid(),
          title: r.title,
          amount: r.amount,
          type: r.type,
          category: r.category,
          date: `${key}-${String(clampDay(y, m - 1, r.day)).padStart(2, "0")}`,
          method: r.method,
          savedTenPercent: r.type === "entrada" ? r.savedTenPercent : false,
          cardId: r.cardId,
        }));
        const titheTotal = created
          .filter((t) => t.type === "entrada" && t.savedTenPercent)
          .reduce((s, t) => s + t.amount * 0.1, 0);
        set({
          transactions: [...created, ...state.transactions],
          recurring: state.recurring.map((r) =>
            r.lastApplied === key ? r : { ...r, lastApplied: key },
          ),
          goals: titheTotal
            ? state.goals.map((g) =>
                g.id === TREASURY_GOAL_ID ? { ...g, balance: g.balance + titheTotal } : g,
              )
            : state.goals,
          xp: state.xp + created.length * 10,
        });
        return created.length;
      },


      addTransaction: (tx) =>
        set((state) => {
          const created = expandInstallments(tx, state.cards);
          let goals = state.goals;
          const first = created[0];
          let celebration = state.celebration;
          if (first.type === "entrada" && first.savedTenPercent) {
            const share = first.amount * 0.1;
            const treasury = state.goals.find((g) => g.id === TREASURY_GOAL_ID);
            goals = state.goals.map((g) =>
              g.id === TREASURY_GOAL_ID ? { ...g, balance: g.balance + share } : g,
            );
            if (state.celebrationsEnabled) {
              celebration = {
                id: uid(),
                kind: "tesouro",
                amount: share,
                title: first.title,
                goalId: TREASURY_GOAL_ID,
                before: treasury?.balance ?? 0,
                after: (treasury?.balance ?? 0) + share,
                xpGained: 50,
              };
            }
          }
          return {
            transactions: [...created, ...state.transactions],
            goals,
            celebration,
            xp: state.xp + 10 + (first.savedTenPercent ? 40 : 0),
          };
        }),

      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, { ...goal, id: uid() }], xp: state.xp + 25 })),

      updateGoal: (id, patch) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      withdrawFromGoal: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, balance: Math.max(0, g.balance - amount) } : g,
          ),
        })),

      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id || g.id === TREASURY_GOAL_ID) })),


      depositToGoal: (id, amount) =>
        set((state) => {
          const goal = state.goals.find((g) => g.id === id);
          return {
            goals: state.goals.map((g) => (g.id === id ? { ...g, balance: g.balance + amount } : g)),
            xp: state.xp + 50,
            celebration:
              state.celebrationsEnabled && goal
                ? {
                    id: uid(),
                    kind: goal.id === TREASURY_GOAL_ID ? "tesouro" : "cofre",
                    amount,
                    title: goal.name,
                    goalId: goal.id,
                    before: goal.balance,
                    after: goal.balance + amount,
                    xpGained: 50,
                  }
                : state.celebration,
          };
        }),

      addAsset: (asset) => set((state) => ({ assets: [...state.assets, { ...asset, id: uid() }], xp: state.xp + 30 })),

      removeAsset: (id) => set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

      addCard: (card) =>
        set((state) => ({ cards: [...state.cards, { ...card, id: uid() }], xp: state.xp + 20 })),

      updateCard: (id, patch) =>
        set((state) => ({ cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
          transactions: state.transactions.map((t) =>
            t.cardId === id ? { ...t, cardId: undefined } : t,
          ),
        })),

      payInvoice: (cardId, key) =>
        set((state) => {
          const marker = `${cardId}:${key}`;
          if (state.paidInvoices.includes(marker)) return state;
          const card = state.cards.find((c) => c.id === cardId);
          return {
            paidInvoices: [...state.paidInvoices, marker],
            xp: state.xp + 30,
            celebration: state.celebrationsEnabled
              ? {
                  id: uid(),
                  kind: "fatura" as const,
                  amount: 0,
                  title: card?.name ?? "Fatura",
                  xpGained: 30,
                }
              : state.celebration,
          };
        }),

      addDebt: (debt) =>
        set((state) => ({
          debts: [
            ...state.debts,
            {
              ...debt,
              paid: debt.paid ?? 0,
              id: uid(),
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
          xp: state.xp + 15,
        })),

      updateDebt: (id, patch) =>
        set((state) => ({ debts: state.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      payDebt: (id, amount) =>
        set((state) => {
          const debt = state.debts.find((d) => d.id === id);
          if (!debt || amount <= 0) return state;
          const value = Math.min(amount, Math.max(0, debt.principal - debt.paid));
          const tx: Transaction = {
            id: uid(),
            title: `Pagamento — ${debt.name}`,
            amount: value,
            type: "saida",
            category: "Resgate de Paz",
            date: new Date().toISOString().slice(0, 10),
            method: "transferencia",
            savedTenPercent: false,
            debtId: debt.id,
          };
          const cleared = debt.paid + value >= debt.principal - 0.01;
          return {
            debts: state.debts.map((d) => (d.id === id ? { ...d, paid: d.paid + value } : d)),
            transactions: [tx, ...state.transactions],
            badges: cleared && !state.badges.includes("sem-correntes")
              ? [...state.badges, "sem-correntes"]
              : state.badges,
            xp: state.xp + 40 + (cleared ? 120 : 0),
            celebration: state.celebrationsEnabled
              ? {
                  id: uid(),
                  kind: "divida" as const,
                  amount: value,
                  title: debt.name,
                  before: debt.paid,
                  after: debt.paid + value,
                  xpGained: 40 + (cleared ? 120 : 0),
                  cleared,
                }
              : state.celebration,
          };
        }),

      removeDebt: (id) => set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

      setBudgetSplit: (category, percent) =>
        set((state) => ({ budgetSplit: { ...state.budgetSplit, [category]: percent } })),

      setPillarSplit: (pillar, percent) =>
        set((state) => {
          const others = (Object.keys(state.pillarSplit) as PillarId[]).filter((p) => p !== pillar);
          const rest = 100 - percent;
          const currentRest = others.reduce((sum, p) => sum + state.pillarSplit[p], 0) || 1;
          const next = { ...state.pillarSplit, [pillar]: percent } as Record<PillarId, number>;
          others.forEach((p, i) => {
            next[p] =
              i === others.length - 1
                ? Math.max(0, rest - others.slice(0, -1).reduce((s, o) => s + next[o], 0))
                : Math.round((state.pillarSplit[p] / currentRest) * rest);
          });
          return { pillarSplit: next };
        }),

      resetPillarSplit: () => set({ pillarSplit: { ...DEFAULT_PILLAR_SPLIT } }),

      dismissCelebration: () => set({ celebration: null }),

      setCelebrationsEnabled: (enabled) =>
        set({ celebrationsEnabled: enabled, celebration: enabled ? null : null }),

      setSecurity: (patch) => set((state) => ({ security: { ...state.security, ...patch } })),

      disableLock: () =>
        set({ security: { pinHash: null, salt: null, biometricId: null, autoLockMinutes: 0 } }),

      setReminder: (patch) => set((state) => ({ reminder: { ...state.reminder, ...patch } })),

      markBackup: () => set({ lastBackupAt: new Date().toISOString() }),

      loadDemoData: () => set({ ...demoState() }),

      clearAll: () => set({ ...emptyState(), hasOnboarded: false }),

      importState: (data) =>
        set((state) => ({
          ...emptyState(),
          ...data,
          // A proteção deste aparelho não vem do backup.
          security: state.security,
          celebration: null,
          hasOnboarded: true,
        })),

      resetToSeed: () => set({ ...demoState() }),
    }),
    {
      name: "aurin-store-v3",
      version: 4,
      skipHydration: true,
      partialize: (state) => {
        const { celebration: _c, ...rest } = state;
        return rest as AurinState;
      },
      migrate: (persisted) => {
        const prev = (persisted ?? {}) as Partial<AurinState>;
        return {
          ...emptyState(),
          ...prev,
          goals: prev.goals?.length ? prev.goals : [emptyTreasury()],
          profile: prev.profile ?? { ...EMPTY_PROFILE },
          recurring: prev.recurring ?? [],
          hasOnboarded: prev.hasOnboarded ?? Boolean(prev.transactions?.length),
          plan: prev.plan ?? "free",
          transactions: (prev.transactions ?? []).map((t: Transaction) =>
            t.category === "Dívidas" ? { ...t, category: "Resgate de Paz" } : t,
          ),
          customCategories: (prev.customCategories ?? []).map((c: string) =>
            c === "Dívidas" ? "Resgate de Paz" : c,
          ),
          celebration: null,
        } as AurinState;
      },
    },
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
  costCeiling: number,
) {
  const spentByCategory = new Map(categoryBreakdown(transactions, key).map((c) => [c.category, c.value]));
  return COST_CATEGORIES.map((category) => {
    const limit = (costCeiling * (split[category] ?? 0)) / 100;
    const spent = spentByCategory.get(category) ?? 0;
    const percent = limit > 0 ? (spent / limit) * 100 : 0;
    return { category, limit, spent, percent };
  });
}

/* ------------------------------- 70/20/10 ---------------------------------- */

export function pillarUsage(
  transactions: Transaction[],
  key: string,
  split: Record<PillarId, number>,
  titheAllocated: number,
) {
  const { income } = monthTotals(transactions, key);
  const used: Record<PillarId, number> = { custo: 0, reserva: 0, ouro: titheAllocated };
  for (const t of transactions) {
    if (t.type !== "saida" || monthKey(t.date) !== key) continue;
    const pillar = CATEGORY_PILLAR[t.category] ?? "custo";
    used[pillar] += t.amount;
  }
  return (Object.keys(split) as PillarId[]).map((id) => {
    const target = (income * split[id]) / 100;
    const value = used[id];
    return {
      id,
      target,
      used: value,
      percent: target > 0 ? (value / target) * 100 : 0,
      remaining: target - value,
    };
  });
}

/* --------------------------------- cartões --------------------------------- */

export interface InvoiceItem {
  key: string;
  due: string;
  total: number;
  items: Transaction[];
  paid: boolean;
}

export function cardInvoices(
  card: CreditCard,
  transactions: Transaction[],
  paidInvoices: string[],
): InvoiceItem[] {
  const map = new Map<string, { due: string; items: Transaction[] }>();
  for (const t of transactions) {
    if (t.cardId !== card.id || t.type !== "saida") continue;
    const cycle = invoiceCycleFor(card, t.date);
    const bucket = map.get(cycle.key) ?? { due: cycle.due, items: [] };
    bucket.items.push(t);
    map.set(cycle.key, bucket);
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      due: v.due,
      items: v.items.sort((a, b) => (a.date < b.date ? 1 : -1)),
      total: v.items.reduce((s, t) => s + t.amount, 0),
      paid: paidInvoices.includes(`${card.id}:${key}`),
    }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
}

export function cardSummary(
  card: CreditCard,
  transactions: Transaction[],
  paidInvoices: string[],
) {
  const invoices = cardInvoices(card, transactions, paidInvoices);
  const nowKey = currentInvoiceKey(card);
  const open = invoices.filter((i) => !i.paid && i.key >= nowKey);
  const committed = open.reduce((s, i) => s + i.total, 0);
  const current = invoices.find((i) => i.key === nowKey);
  const next = invoices.find((i) => i.key > nowKey);
  const available = Math.max(0, card.limit - committed);
  return {
    invoices,
    open,
    current,
    next,
    committed,
    available,
    usage: card.limit > 0 ? (committed / card.limit) * 100 : 0,
  };
}

export function totalCardCommitment(
  cards: CreditCard[],
  transactions: Transaction[],
  paidInvoices: string[],
) {
  return cards.reduce((sum, c) => sum + cardSummary(c, transactions, paidInvoices).committed, 0);
}

/* --------------------------------- dívidas --------------------------------- */

export function debtSummary(debts: Debt[]) {
  const total = debts.reduce((s, d) => s + d.principal, 0);
  const paid = debts.reduce((s, d) => s + d.paid, 0);
  const remaining = Math.max(0, total - paid);
  const weightedRate =
    remaining > 0
      ? debts.reduce((s, d) => s + d.interestRate * Math.max(0, d.principal - d.paid), 0) / remaining
      : 0;
  const monthly = debts.reduce(
    (s, d) => s + (d.installments > 0 ? d.principal / d.installments : 0),
    0,
  );
  return {
    total,
    paid,
    remaining,
    weightedRate,
    monthly,
    progress: total > 0 ? (paid / total) * 100 : 100,
    monthsToFreedom: monthly > 0 ? Math.ceil(remaining / monthly) : 0,
  };
}

export type Strategy = "avalanche" | "snowball";

/** Simula a quitação das dívidas com um valor mensal disponível. */
export function simulatePayoff(debts: Debt[], monthlyBudget: number, strategy: Strategy) {
  let items = debts
    .map((d) => ({ id: d.id, name: d.name, balance: Math.max(0, d.principal - d.paid), rate: d.interestRate / 100 }))
    .filter((d) => d.balance > 0);
  if (!items.length || monthlyBudget <= 0) return { months: 0, interest: 0, series: [] as { month: number; saldo: number }[] };

  const series: { month: number; saldo: number }[] = [
    { month: 0, saldo: items.reduce((s, i) => s + i.balance, 0) },
  ];
  let interest = 0;
  let month = 0;

  while (items.length && month < 360) {
    month++;
    items = items.map((i) => {
      const added = i.balance * i.rate;
      interest += added;
      return { ...i, balance: i.balance + added };
    });
    items.sort((a, b) => (strategy === "avalanche" ? b.rate - a.rate : a.balance - b.balance));
    let left = monthlyBudget;
    for (const item of items) {
      if (left <= 0) break;
      const pay = Math.min(left, item.balance);
      item.balance -= pay;
      left -= pay;
    }
    items = items.filter((i) => i.balance > 0.01);
    series.push({ month, saldo: Math.round(items.reduce((s, i) => s + i.balance, 0)) });
    if (left === monthlyBudget) break; // orçamento insuficiente
  }

  return { months: month, interest, series };
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
  cards?: CreditCard[];
  debts?: Debt[];
  paidInvoices?: string[];
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
  if ((state.debts ?? []).some((d) => d.paid >= d.principal - 0.01)) unlocked.add("sem-correntes");
  const cards = state.cards ?? [];
  if (
    cards.length > 0 &&
    cards.every(
      (c) => cardSummary(c, state.transactions, state.paidInvoices ?? []).usage <= 70,
    )
  )
    unlocked.add("mestre-fatura");

  return BADGES.map((badge) => ({ ...badge, unlocked: unlocked.has(badge.id) }));
}
