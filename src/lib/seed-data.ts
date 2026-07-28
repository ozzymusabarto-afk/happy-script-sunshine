import type { FixedAsset, Goal, Transaction } from "./aurin";
import { TREASURY_GOAL_ID } from "./aurin";

const pad = (n: number) => String(n).padStart(2, "0");

function iso(monthsAgo: number, day: number) {
  const base = new Date();
  const d = new Date(base.getFullYear(), base.getMonth() - monthsAgo, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, maxDay, monthsAgo === 0 ? base.getDate() : maxDay);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(safeDay)}`;
}

let counter = 0;
const id = (prefix: string) => `${prefix}-${++counter}`;

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
  );
}

export const seedTransactions: Transaction[] = seeds.map((s) => ({
  id: id("tx"),
  title: s.title,
  amount: s.amount,
  type: s.type,
  category: s.category,
  date: iso(s.m, s.d),
  method: s.method,
  savedTenPercent: Boolean(s.tithe),
}));

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
