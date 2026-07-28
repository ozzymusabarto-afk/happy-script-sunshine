import type { CreditCard, Debt, FixedAsset, Goal, Transaction } from "./aurin";
import { TREASURY_GOAL_ID } from "./aurin";

const pad = (n: number) => String(n).padStart(2, "0");

function iso(monthsAgo: number, day: number) {
  const base = new Date();
  const d = new Date(base.getFullYear(), base.getMonth() - monthsAgo, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, maxDay, monthsAgo === 0 ? base.getDate() : maxDay);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(safeDay)}`;
}

function isoFuture(monthsAhead: number, day: number) {
  const base = new Date();
  const d = new Date(base.getFullYear(), base.getMonth() + monthsAhead, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(Math.min(day, maxDay))}`;
}

let counter = 0;
const id = (prefix: string) => `${prefix}-${++counter}`;

export const CARD_OURO_ID = "card-ouro";
export const CARD_PRATA_ID = "card-prata";

export const seedCards: CreditCard[] = [
  {
    id: CARD_OURO_ID,
    name: "Cartão Ouro",
    brand: "Visa",
    limit: 12000,
    closingDay: 20,
    dueDay: 28,
    color: "from-[#c9a227] to-[#6b4f0a]",
  },
  {
    id: CARD_PRATA_ID,
    name: "Cartão Prata",
    brand: "Mastercard",
    limit: 4000,
    closingDay: 5,
    dueDay: 12,
    color: "from-[#1f6feb] to-[#0b2e63]",
  },
];

interface Seed {
  m: number;
  d: number;
  title: string;
  amount: number;
  type: Transaction["type"];
  category: string;
  method: Transaction["method"];
  tithe?: boolean;
}

const seeds: Seed[] = [];

for (let m = 5; m >= 0; m--) {
  seeds.push({
    m,
    d: 5,
    title: "Salário mensal",
    amount: 8200,
    type: "entrada",
    category: "Salário",
    method: "transferencia",
    tithe: true,
  });
  if (m % 2 === 0)
    seeds.push({
      m,
      d: 12,
      title: "Projeto freelance",
      amount: 1850 + m * 90,
      type: "entrada",
      category: "Freelance",
      method: "pix",
      tithe: m !== 4,
    });
  if (m <= 3)
    seeds.push({
      m,
      d: 20,
      title: "Dividendos e juros",
      amount: 240 + m * 35,
      type: "entrada",
      category: "Renda Passiva",
      method: "transferencia",
      tithe: true,
    });

  seeds.push(
    { m, d: 6, title: "Aluguel", amount: 2300, type: "saida", category: "Moradia", method: "transferencia" },
    { m, d: 9, title: "Supermercado", amount: 980 + m * 20, type: "saida", category: "Alimentação", method: "cartao" },
    { m, d: 15, title: "Combustível e transporte", amount: 430, type: "saida", category: "Transporte", method: "cartao" },
    { m, d: 17, title: "Plano de saúde", amount: 520, type: "saida", category: "Saúde", method: "cartao" },
    { m, d: 21, title: "Curso de finanças", amount: 320, type: "saida", category: "Educação", method: "pix" },
    { m, d: 23, title: "Restaurantes e streaming", amount: 610 + m * 15, type: "saida", category: "Lazer", method: "cartao" },
    { m, d: 26, title: "Energia e internet", amount: 380, type: "saida", category: "Moradia", method: "pix" },
    { m, d: 28, title: "Despesas diversas", amount: 210, type: "saida", category: "Outros", method: "dinheiro" },
    { m, d: 10, title: "Parcela do empréstimo", amount: 640, type: "saida", category: "Resgate de Paz", method: "transferencia" },
  );
}

const baseTransactions: Transaction[] = seeds.map((s) => ({
  id: id("tx"),
  title: s.title,
  amount: s.amount,
  type: s.type,
  category: s.category,
  date: iso(s.m, s.d),
  method: s.method,
  savedTenPercent: Boolean(s.tithe),
  cardId: s.method === "cartao" ? (s.amount > 500 ? CARD_OURO_ID : CARD_PRATA_ID) : undefined,
}));

/* Compras parceladas em aberto */
function installmentSeries(
  title: string,
  total: number,
  count: number,
  startMonthsAgo: number,
  day: number,
  category: string,
  cardId: string,
): Transaction[] {
  const groupId = id("grp");
  const share = Math.round((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => {
    const offset = startMonthsAgo - i;
    const date = offset >= 0 ? iso(offset, day) : isoFuture(-offset, day);
    return {
      id: id("tx"),
      title: `${title} (${i + 1}/${count})`,
      amount: share,
      type: "saida" as const,
      category,
      date,
      method: "cartao" as const,
      savedTenPercent: false,
      cardId,
      groupId,
      installments: count,
      installmentIndex: i + 1,
    };
  });
}

export const seedTransactions: Transaction[] = [
  ...baseTransactions,
  ...installmentSeries("Notebook novo", 6000, 10, 2, 14, "Outros", CARD_OURO_ID),
  ...installmentSeries("Passagens aéreas", 2400, 6, 1, 8, "Lazer", CARD_PRATA_ID),
].sort((a, b) => (a.date < b.date ? 1 : -1));

export const seedDebts: Debt[] = [
  {
    id: id("debt"),
    name: "Empréstimo pessoal",
    type: "emprestimo",
    principal: 18000,
    paid: 7680,
    interestRate: 2.1,
    installments: 24,
    dueDay: 10,
    createdAt: iso(12, 10),
  },
  {
    id: id("debt"),
    name: "Rotativo Cartão Prata",
    type: "rotativo",
    principal: 3200,
    paid: 900,
    interestRate: 12.5,
    installments: 8,
    dueDay: 12,
    createdAt: iso(3, 12),
  },
];

export const seedGoals: Goal[] = [
  { id: TREASURY_GOAL_ID, name: "Tesouro Pessoal (Dízimo de Arkad)", target: 20000, balance: 6420, kind: "investimento" },
  { id: id("goal"), name: "Reserva de Emergência", target: 32000, balance: 19800, kind: "reserva" },
  { id: id("goal"), name: "Aparato de Moradia", target: 90000, balance: 24500, kind: "moradia" },
  { id: id("goal"), name: "Liberdade Financeira", target: 500000, balance: 58300, kind: "aposentadoria" },
];

export const seedAssets: FixedAsset[] = [
  { id: id("asset"), name: "Sala comercial alugada", value: 210000, monthlyIncome: 1450 },
];

export const seedBadges = ["primeira-moeda", "multiplicador", "arquiteto-futuro"];
export const seedXp = 980;
