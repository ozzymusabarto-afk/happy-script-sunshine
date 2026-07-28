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

export const EXPENSE_CATEGORIES = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros",
] as const;

export const INCOME_CATEGORIES = ["Salário", "Freelance", "Renda Passiva", "Outros"] as const;

/** Percentual do teto de 90% da renda destinado a cada categoria. */
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
];
