/**
 * Dicionário central de tom do AURIN.
 *
 * Toda a linguagem visível deve nascer aqui: acolhedora, clara e voltada à
 * construção de futuro. Nada de punição, cobrança ou vocabulário de planilha.
 */

export type ToneLevel = "ritmo" | "atencao" | "alem";

/** Saudação conforme o horário local. */
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Data por extenso, em português. */
export function longDate(date = new Date()) {
  const text = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MORNING_LINES = [
  "Hoje é mais um dia para construir o futuro que você já começou.",
  "Seu amanhã está sendo escrito pelas escolhas simples de hoje.",
  "Nada precisa ser perfeito. Só precisa continuar.",
  "Cada moeda guardada hoje é um dia de tranquilidade lá na frente.",
  "Você não está controlando dinheiro. Está construindo liberdade.",
  "O ouro que você guarda trabalha enquanto você dorme.",
  "Respire: seu plano já está em movimento.",
];

const EVENING_LINES = [
  "O dia se fecha e seu futuro ficou um pouco mais firme.",
  "Descanse. O ouro guardado segue trabalhando por você.",
  "Amanhã continua a construção. Hoje, apenas orgulho.",
  "Você cuidou do seu futuro hoje — isso basta.",
];

/** Índice estável por dia, para a frase não trocar a cada render. */
function dayIndex(date: Date, size: number) {
  const seed = Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
  return seed % size;
}

/** Frase de clareza do dia, sensível ao horário. */
export function dailyLine(date = new Date(), hasActivity = true) {
  if (!hasActivity) return "Sua jornada começa com um passo: crie seu primeiro cofre.";
  const evening = date.getHours() >= 18 || date.getHours() < 5;
  const pool = evening ? EVENING_LINES : MORNING_LINES;
  return pool[dayIndex(date, pool.length)];
}

/** Rótulos acolhedores usados no lugar dos termos frios. */
export const LABELS = {
  debts: "Resgate de Paz (dívidas)",
  debtsShort: "Paz",
  balance: "O que já é seu",
  expense: "Escolhas do mês (gastos)",
  income: "Entrou este mês",
  budget: "Seu ritmo do mês",
} as const;

/**
 * Vocabulário temático do AURIN, acompanhado de termos financeiros simples
 * quando necessário para dar clareza ao primeiro uso.
 */
export const WORDS = {
  rescue: "Resgate de Paz",
  rescuePlural: "Resgates de Paz",
  plan: "Plano de Libertação",
  unlocks: "Desbloqueios do Futuro",
  step: "Passo de libertação",
  weight: "Peso que segura você",
  remaining: "Quanto falta para a paz",
  freed: "Já libertado",
  liberate: "Libertar",
  victory: "Batalha vencida",
  victories: "Batalhas vencidas",
  peaceTime: "Tempo de Paz",
  futureCoins: "Moedas do Futuro",
  achievements: "Conquistas",
} as const;

/** Estado de um pilar de orçamento, sempre sem julgamento. */
export function pillarTone(percent: number): ToneLevel {
  if (percent > 100.5) return "alem";
  if (percent >= 99.5) return "ritmo";
  if (percent >= 85) return "atencao";
  return "ritmo";
}

export const TONE_TEXT: Record<ToneLevel, string> = {
  ritmo: "text-success",
  atencao: "text-warning",
  alem: "text-primary",
};

export const TONE_BG: Record<ToneLevel, string> = {
  ritmo: "bg-success",
  atencao: "bg-warning",
  alem: "bg-gold",
};

export const TONE_LABEL: Record<ToneLevel, string> = {
  ritmo: "No ritmo",
  atencao: "Atenção gentil",
  alem: "Este mês pediu mais",
};

/** Mensagem encorajadora + próximo passo concreto para um pilar. */
export function pillarMessage(
  tone: ToneLevel,
  label: string,
  gap: number,
  money: (v: number) => string,
  isGold = false,
) {
  if (isGold) {
    if (gap <= 0) return "Seu ouro do mês está completo. Essa é a parte que trabalha por você.";
    return `Faltam ${money(gap)} para completar o ouro deste mês — o pedaço que constrói o seu futuro.`;
  }
  if (tone === "ritmo") {
    return `${label} está no ritmo. Sobram ${money(Math.max(0, gap))} de folga tranquila — proteja essa margem.`;
  }
  if (tone === "atencao") {
    return routeWatch(label, gap, money);
  }
  return routeCorrection({ area: label, over: Math.abs(gap), money, seed: (label.length % 7) / 7 });
}

/** Resumo geral do mês, em tom de acolhimento. */
export function monthMood(anyOver: boolean, savedSomething: boolean) {
  if (!anyOver && savedSomething) {
    return "Mês equilibrado e com ouro guardado. Você está exatamente onde queria estar.";
  }
  if (!anyOver) {
    return "Seus pilares estão equilibrados. Guardar um pouco agora deixa o mês redondo.";
  }
  if (savedSomething) {
    return "Um pilar pediu mais este mês — e mesmo assim você guardou ouro. Isso é progresso real.";
  }
  return "Este mês pediu mais de você. Nada quebrou: basta retomar o ritmo no próximo aporte.";
}

/** Frases curtas de recompensa emocional. */
const PEACE_LINES = [
  "Sua paz de espírito aumentou hoje.",
  "Você comprou tranquilidade — não um produto.",
  "Mais um pedaço do futuro garantido.",
  "Seu eu de amanhã agradece por hoje.",
  "Liberdade se constrói assim: um passo de cada vez.",
];

export function peaceLine(seed = Math.random()) {
  return PEACE_LINES[Math.floor(seed * PEACE_LINES.length) % PEACE_LINES.length];
}

/* ------------------------- voz do mentor sábio ---------------------------- */

/** Princípios de disciplina que sustentam cada orientação. */
const PRINCIPLES = [
  "Parte de tudo o que você ganha é sua para guardar.",
  "O ouro foge de quem o gasta sem plano, e procura quem o protege.",
  "Um plano simples, seguido com constância, vence qualquer mês difícil.",
  "Controlar as escolhas de hoje é o que sustenta a paz de amanhã.",
  "Cada moeda guardada é um servo que trabalha por você.",
];

function pick<T>(pool: T[], seed: number) {
  const i = Math.abs(Math.floor(seed * pool.length)) % pool.length;
  return pool[i];
}

/**
 * Correção de rota: reconhecimento neutro → princípio → um passo concreto.
 * Sereno, educado e firme. Nunca culpa, nunca alarme.
 */
export function routeCorrection(opts: {
  area: string;
  over: number;
  money: (v: number) => string;
  seed?: number;
  name?: string;
}) {
  const { area, over, money, seed = 0.5, name } = opts;
  const weekly = money(Math.max(1, Math.round(over / 4)));
  const who = name?.trim() ? `${name.trim()}, ` : "";
  const openings = [
    `${who}${area} pediu ${money(over)} a mais este mês. Isso é informação, não falha.`,
    `${who}o combinado de ${area} foi ultrapassado em ${money(over)}. Nada aqui está perdido.`,
    `${who}${area} passou do ritmo em ${money(over)}. Um desvio percebido a tempo é fácil de corrigir.`,
  ];
  const actions = [
    `Redirecione ${weekly} por semana e o ritmo volta antes do próximo ciclo.`,
    `Escolha um único gasto de ${weekly} para adiar nesta semana — isso já recoloca a rota.`,
    `Guarde ${weekly} nas próximas quatro semanas e o mês fecha equilibrado de novo.`,
  ];
  return `${pick(openings, seed)} ${pick(PRINCIPLES, seed * 1.7)} ${pick(actions, seed * 2.3)}`;
}

/** Aviso sereno de aproximação do limite — firme, sem alarme. */
export function routeWatch(area: string, left: number, money: (v: number) => string) {
  return `${area} está perto do combinado: restam ${money(Math.max(0, left))}. Proteger essa margem agora é o que mantém o plano de pé.`;
}

/** Orientação serena sobre o uso do limite de um cartão. */
export function cardGuidance(opts: {
  card: string;
  usage: number;
  free: number;
  money: (v: number) => string;
  seed?: number;
}) {
  const { card, usage, free, money, seed = 0.5 } = opts;
  const lines = [
    `${card} já usa ${usage.toFixed(0)}% do limite. Restam ${money(Math.max(0, free))} — trate esse espaço como reserva, não como dinheiro extra.`,
    `${card} está em ${usage.toFixed(0)}% do limite. O crédito é ferramenta, nunca renda: preservar ${money(Math.max(0, free))} agora protege o próximo mês.`,
    `${card} passou de dois terços do limite. Sobram ${money(Math.max(0, free))}; segurar o ritmo aqui evita comprometer o ouro de amanhã.`,
  ];
  return pick(lines, seed);
}

/** Encorajamento firme e acolhedor na Rota de Libertação. */
export function rescueEncouragement(opts: {
  progress: number;
  months: number;
  seed?: number;
  name?: string;
}) {
  const { progress, months, seed = 0.5, name } = opts;
  const who = name?.trim() ? `${name.trim()}, ` : "";
  if (progress >= 100)
    return `${who}todas as correntes caíram. Agora todo o ouro trabalha só por você.`;
  const openings = [
    `${who}${progress.toFixed(0)}% do seu futuro já está livre.`,
    `${who}você já libertou ${progress.toFixed(0)}% do caminho.`,
    `${who}cada pagamento feito solta uma corrente — já são ${progress.toFixed(0)}%.`,
  ];
  const closings = [
    months > 0
      ? `Mantendo esse passo, a paz completa chega em ${months} mês${months === 1 ? "" : "es"}.`
      : "A paz completa está ao alcance deste ciclo.",
    "Constância vale mais que pressa: siga o plano e o resto se resolve.",
    "Nada aqui exige perfeição — só continuidade.",
  ];
  return `${pick(openings, seed)} ${pick(closings, seed * 1.9)}`;
}

/**
 * Celebração: entusiasmo com ganho concreto de paz.
 */
export function mentorPraise(opts: {
  amount: number;
  days: number;
  future: number;
  money: (v: number) => string;
  seed?: number;
  name?: string;
}) {
  const { amount, days, future, money, seed = 0.5, name } = opts;
  const who = name?.trim() ? `${name.trim()}, ` : "";
  const openings = [
    `${who}excelente decisão.`,
    `${who}é exatamente assim que se constrói.`,
    `${who}mais uma vitória silenciosa.`,
    `${who}que gesto poderoso.`,
  ];
  const dayText =
    days >= 1
      ? `${Math.round(days)} dia${Math.round(days) === 1 ? "" : "s"} de liberdade`
      : "algumas horas de liberdade";
  return `${pick(openings, seed)} ${money(amount)} guardados hoje representam ${dayText} e poderiam chegar a ${money(future)} em dez anos, nesta simulação.`;
}
