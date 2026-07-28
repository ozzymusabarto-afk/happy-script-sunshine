export type TxType = "entrada" | "saida";
export type PaymentMethod = "pix" | "cartao" | "dinheiro" | "transferencia";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TxType;
  category: string;
  date: string; // ISO yyyy-mm-dd
  method: PaymentMethod;
  savedTenPercent: boolean;
  /** Cartão de crédito usado (quando method === "cartao"). */
  cardId?: string;
  /** Total de parcelas do grupo. */
  installments?: number;
  /** Índice desta parcela (1-based). */
  installmentIndex?: number;
  /** Agrupa parcelas de uma mesma compra. */
  groupId?: string;
  /** Vincula o lançamento à quitação de uma dívida. */
  debtId?: string;
}

export type GoalKind = "reserva" | "moradia" | "investimento" | "aposentadoria" | "outro";

export interface Goal {
  id: string;
  name: string;
  target: number;
  balance: number;
  kind: GoalKind;
}

export interface FixedAsset {
  id: string;
  name: string;
  value: number;
  monthlyIncome: number;
}

/* ------------------------------- perfil ----------------------------------- */

export interface Profile {
  name: string;
  monthlyIncome: number;
  dreamName: string;
  dreamTarget: number;
  dreamYears: number;
}

export const EMPTY_PROFILE: Profile = {
  name: "",
  monthlyIncome: 0,
  dreamName: "",
  dreamTarget: 0,
  dreamYears: 5,
};

/* ---------------------------- lançamentos fixos ---------------------------- */

export interface Recurring {
  id: string;
  title: string;
  amount: number;
  type: TxType;
  category: string;
  method: PaymentMethod;
  day: number;
  savedTenPercent: boolean;
  cardId?: string;
  /** Último mês (yyyy-mm) em que este lançamento já foi aplicado. */
  lastApplied?: string;
}

/* --------------------------------- cartões --------------------------------- */

export type CardBrand = "Visa" | "Mastercard" | "Elo" | "Amex" | "Outro";

export interface CreditCard {
  id: string;
  name: string;
  brand: CardBrand;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

export const CARD_BRANDS: CardBrand[] = ["Visa", "Mastercard", "Elo", "Amex", "Outro"];

export const CARD_COLORS = [
  "from-[#c9a227] to-[#6b4f0a]",
  "from-[#1f6feb] to-[#0b2e63]",
  "from-[#12b5a5] to-[#0a4a45]",
  "from-[#8b5cf6] to-[#3b1d78]",
  "from-[#e2574c] to-[#6b1d17]",
];

/* --------------------------------- dívidas --------------------------------- */

export type DebtType = "rotativo" | "emprestimo" | "financiamento" | "chequeespecial" | "pessoal" | "outro";

export const DEBT_LABELS: Record<DebtType, string> = {
  rotativo: "Rotativo do cartão",
  emprestimo: "Empréstimo",
  financiamento: "Financiamento",
  chequeespecial: "Cheque especial",
  pessoal: "Dívida pessoal",
  outro: "Outro",
};

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  principal: number;
  paid: number;
  interestRate: number; // % ao mês
  installments: number;
  dueDay: number;
  createdAt: string;
}

/* ------------------------------- categorias -------------------------------- */

export const COST_CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros",
] as const;

export const EXPENSE_CATEGORIES = [
  ...COST_CATEGORIES,
  "Dívidas",
  "Reserva",
  "Investimento",
] as const;

export const INCOME_CATEGORIES = ["Salário", "Freelance", "Renda Passiva", "Outros"] as const;

/* ------------------------------ regra 70/20/10 ----------------------------- */

export type PillarId = "custo" | "reserva" | "ouro";

export interface Pillar {
  id: PillarId;
  label: string;
  short: string;
  percent: number;
  description: string;
}

export const PILLARS: Pillar[] = [
  {
    id: "custo",
    label: "Custo de Vida",
    short: "70%",
    percent: 70,
    description: "Moradia, alimentação, transporte e tudo que mantém sua vida funcionando.",
  },
  {
    id: "reserva",
    label: "Reservas & Dívidas",
    short: "20%",
    percent: 20,
    description: "Reserva de emergência e quitação acelerada de dívidas.",
  },
  {
    id: "ouro",
    label: "Ouro / Investimentos",
    short: "10%",
    percent: 10,
    description: "O dízimo de Arkad: a parte que trabalha por você para sempre.",
  },
];

export const DEFAULT_PILLAR_SPLIT: Record<PillarId, number> = {
  custo: 70,
  reserva: 20,
  ouro: 10,
};

export const CATEGORY_PILLAR: Record<string, PillarId> = {
  Moradia: "custo",
  Alimentação: "custo",
  Transporte: "custo",
  Lazer: "custo",
  Saúde: "custo",
  Educação: "custo",
  Outros: "custo",
  Dívidas: "reserva",
  Reserva: "reserva",
  Investimento: "ouro",
};

/** Percentual do pilar Custo de Vida (70%) destinado a cada categoria. */
export const BUDGET_SPLIT: Record<string, number> = {
  Moradia: 30,
  Alimentação: 20,
  Transporte: 12,
  Lazer: 10,
  Saúde: 10,
  Educação: 10,
  Outros: 8,
};


export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
};

export const GOAL_LABELS: Record<GoalKind, string> = {
  reserva: "Reserva de Emergência",
  moradia: "Habitação",
  investimento: "Investimento",
  aposentadoria: "Renda Futura",
  outro: "Outro",
};

export const TREASURY_GOAL_ID = "tesouro-pessoal";

export const LEVELS = [
  { title: "Aprendiz de Babilônia", xp: 0 },
  { title: "Escriba do Ouro", xp: 400 },
  { title: "Guardião do Ouro", xp: 1200 },
  { title: "Mercador de Nínive", xp: 2600 },
  { title: "AURIN Master", xp: 5000 },
] as const;

export function levelFor(xp: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next
    ? ((xp - current.xp) / (next.xp - current.xp)) * 100
    : 100;
  return {
    level: index + 1,
    title: current.title,
    nextTitle: next?.title ?? null,
    xpToNext: next ? next.xp - xp : 0,
    progress: Math.max(0, Math.min(100, progress)),
  };
}

export const WISDOM_QUOTES = [
  "Uma parte de tudo o que você ganha é sua para guardar.",
  "O ouro chega alegremente a quem guarda ao menos um décimo dos seus ganhos.",
  "Aquilo que cada um chama de despesa necessária sempre crescerá para igualar seus ganhos.",
  "O ouro trabalha diligentemente para quem encontra um uso lucrativo para ele.",
  "Guarde seu tesouro contra a perda investindo apenas onde o principal esteja seguro.",
  "A riqueza que chega depressa vai embora da mesma forma.",
  "Nenhum homem é rico se seus filhos não puderem contar com o seu patrimônio.",
  "Consulte homens sábios; procure conselho de quem lida diariamente com dinheiro.",
  "Onde há determinação, sempre se encontra um caminho.",
  "A boa sorte espera pelo homem que aproveita a oportunidade.",
  "O trabalho é o melhor amigo que já tive.",
  "Cada moeda que você guarda é um escravo que trabalha por você.",
  "Melhor um pouco de cautela do que um grande arrependimento.",
  "Não se pode encher de sabedoria uma bolsa vazia sem antes enchê-la de disciplina.",
  "O homem que gasta mais do que ganha semeia ventos e colhe tempestades.",
  "Providencie antecipadamente as necessidades da sua velhice.",
  "Quanto mais sabedoria conhecemos, mais podemos ganhar.",
  "A oportunidade é uma deusa arrogante que não perde tempo com os despreparados.",
  "Comece hoje: o melhor momento de plantar um carvalho foi há vinte anos.",
  "Domine seus desejos antes que eles dominem sua bolsa.",
];

export function quoteOfTheDay(seed = new Date()) {
  const start = new Date(seed.getFullYear(), 0, 0);
  const day = Math.floor((seed.getTime() - start.getTime()) / 86400000);
  return WISDOM_QUOTES[day % WISDOM_QUOTES.length];
}

export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const brlCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
};

export interface BadgeDef {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  {
    id: "primeira-moeda",
    icon: "🥇",
    name: "Primeira Moeda de Ouro",
    description: "Guardou 10% de uma entrada pela primeira vez.",
  },
  {
    id: "escudo-babilonia",
    icon: "🛡️",
    name: "Escudo da Babilônia",
    description: "Reserva de emergência cobrindo 3 meses de despesas.",
  },
  {
    id: "multiplicador",
    icon: "📈",
    name: "Multiplicador",
    description: "Primeiro aporte registrado em um cofre de investimento.",
  },
  {
    id: "consistencia",
    icon: "🔥",
    name: "Consistência Babilônica",
    description: "7 dias seguidos registrando suas moedas.",
  },
  {
    id: "senhor-dizimo",
    icon: "👑",
    name: "Senhor do Dízimo",
    description: "Cumpriu integralmente o dízimo de Arkad no mês.",
  },
  {
    id: "arquiteto-futuro",
    icon: "🏛️",
    name: "Arquiteto do Futuro",
    description: "Registrou um ativo fixo ou fonte de renda passiva.",
  },
  {
    id: "sem-correntes",
    icon: "⛓️‍💥",
    name: "Sem Correntes",
    description: "Quitou integralmente uma dívida.",
  },
  {
    id: "mestre-fatura",
    icon: "💳",
    name: "Mestre da Fatura",
    description: "Nenhum cartão acima de 70% do limite utilizado.",
  },
];

/* ----------------------------- ciclos de fatura ---------------------------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

export const clampDay = (year: number, month0: number, day: number) =>
  Math.min(day, new Date(year, month0 + 1, 0).getDate());

/**
 * Define em qual fatura uma compra cai: se a data for depois do fechamento,
 * ela entra na fatura do mês seguinte.
 */
export function invoiceCycleFor(card: Pick<CreditCard, "closingDay" | "dueDay">, isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  let month0 = m - 1;
  let year = y;
  if (d > card.closingDay) month0 += 1;
  if (month0 > 11) {
    month0 -= 12;
    year += 1;
  }
  const key = `${year}-${pad2(month0 + 1)}`;
  const due = `${year}-${pad2(month0 + 1)}-${pad2(clampDay(year, month0, card.dueDay))}`;
  return { key, due, year, month0 };
}

export function currentInvoiceKey(card: Pick<CreditCard, "closingDay" | "dueDay">, base = new Date()) {
  const iso = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
  return invoiceCycleFor(card, iso).key;
}

export function nextInvoiceKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function dueDateFor(card: Pick<CreditCard, "dueDay">, key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${y}-${pad2(m)}-${pad2(clampDay(y, m - 1, card.dueDay))}`;
}

export function daysUntil(iso: string) {
  const target = new Date(`${iso}T12:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.round((target - today) / 86400000);
}

/** Adiciona meses a uma data ISO preservando o dia quando possível. */
export function addMonthsIso(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1 + months, 1);
  const day = clampDay(date.getFullYear(), date.getMonth(), d);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(day)}`;
}

export const DEBT_QUOTES = [
  "Onde há determinação, sempre se encontra um caminho — inclusive para sair das dívidas.",
  "Pague suas dívidas com determinação crescente; cada credor pago é uma corrente a menos.",
  "Melhor pagar pouco e sempre do que prometer muito e nunca cumprir.",
];
