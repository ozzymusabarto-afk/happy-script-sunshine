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
  const seed = Number(
    `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`,
  );
  return seed % size;
}

/** Frase de clareza do dia, sensível ao horário. */
export function dailyLine(date = new Date()) {
  const evening = date.getHours() >= 18 || date.getHours() < 5;
  const pool = evening ? EVENING_LINES : MORNING_LINES;
  return pool[dayIndex(date, pool.length)];
}

/** Rótulos acolhedores usados no lugar dos termos frios. */
export const LABELS = {
  debts: "Rota de Libertação",
  debtsShort: "Libertação",
  balance: "O que já é seu",
  expense: "Escolhas do mês",
  income: "Entrou este mês",
  budget: "Seu ritmo do mês",
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
) {
  if (tone === "ritmo") {
    return `${label} está no ritmo. Sobram ${money(Math.max(0, gap))} de folga tranquila.`;
  }
  if (tone === "atencao") {
    return `${label} está chegando perto do combinado. Restam ${money(Math.max(0, gap))} — dá para fechar com calma.`;
  }
  return `${label} pediu ${money(Math.abs(gap))} a mais este mês. Um ajuste desse tamanho já recoloca você no ritmo.`;
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
