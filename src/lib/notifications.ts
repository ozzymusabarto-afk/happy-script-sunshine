/**
 * Chamado da manhã: lembretes gentis, nunca cobranças.
 * Usa a Notification API quando o aparelho permite; quando não permite
 * (iOS fora do app instalado), a mensagem aparece ao abrir o AURIN.
 */

export interface MorningContext {
  name?: string;
  dreamName?: string;
  dreamProgress?: number; // 0-100
  monthsOfPeace?: number;
  streakDays?: number;
}

export const DEFAULT_REMINDER_TIME = "08:00";

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function askNotificationPermission() {
  if (!notificationsSupported()) return "unsupported" as const;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied" as const;
  }
}

export function morningMessage(ctx: MorningContext) {
  const hello = ctx.name ? `Bom dia, ${ctx.name}!` : "Bom dia!";
  const options: string[] = [];

  if (ctx.dreamProgress && ctx.dreamProgress > 0) {
    options.push(
      `${hello} Seu sonho "${ctx.dreamName ?? "principal"}" já está ${Math.round(
        ctx.dreamProgress,
      )}% construído. Que tal registrar sua paz de hoje?`,
    );
  }
  if (ctx.monthsOfPeace && ctx.monthsOfPeace > 0) {
    const meses =
      ctx.monthsOfPeace < 1 ? "algumas semanas" : `${Math.floor(ctx.monthsOfPeace)} mês(es)`;
    options.push(
      `${hello} Você já comprou ${meses} de tranquilidade. Vamos somar mais um pouco hoje?`,
    );
  }
  if (ctx.streakDays && ctx.streakDays > 1) {
    options.push(`${hello} ${ctx.streakDays} dias seguidos cuidando do seu futuro. Bonito de ver.`);
  }
  options.push(`${hello} Um registro simples hoje já move seu futuro um passo à frente.`);
  options.push(`${hello} Cada moeda guardada hoje é um pedaço de paz comprado de volta.`);

  const index = new Date().getDate() % options.length;
  return options[index];
}

export function showMorningNotification(ctx: MorningContext) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    new Notification("AURIN · Chamado da manhã", {
      body: morningMessage(ctx),
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      tag: "aurin-morning",
    });
    return true;
  } catch {
    return false;
  }
}

/** Milissegundos até o próximo horário "HH:MM" (hoje ou amanhã). */
export function msUntil(time: string) {
  const [h, m] = time.split(":").map((n) => Number(n) || 0);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

/* ----------------------- ritmo, silêncio e tom de voz ---------------------- */

export type ReminderTone = "sereno" | "entusiasmado" | "pratico" | "personalizado";
export type ReminderFrequency = "diario" | "dias-uteis" | "semanal" | "personalizado";

export const TONE_LABELS: Record<ReminderTone, string> = {
  sereno: "Sereno (mentor calmo)",
  entusiasmado: "Entusiasmado (celebração)",
  pratico: "Prático (direto ao ponto)",
  personalizado: "Minha própria mensagem",
};

export const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  diario: "Todos os dias",
  "dias-uteis": "Somente dias úteis",
  semanal: "Uma vez por semana",
  personalizado: "Dias que eu escolher",
};

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface ReminderVoice {
  tone?: ReminderTone;
  customMessage?: string | null;
}

const TONE_TEMPLATES: Record<
  Exclude<ReminderTone, "personalizado">,
  (ctx: MorningContext, hello: string) => string[]
> = {
  sereno: (ctx, hello) => [
    `${hello} Respire. Um registro simples hoje já move seu futuro um passo à frente.`,
    `${hello} A riqueza chega para quem guarda com constância — e você está guardando.`,
    ctx.dreamName
      ? `${hello} Seu sonho "${ctx.dreamName}" continua de pé. Cuide dele com calma hoje.`
      : `${hello} Cada moeda guardada hoje é um pedaço de paz comprado de volta.`,
  ],
  entusiasmado: (ctx, hello) => [
    `${hello} Hoje é mais um dia para somar ouro à sua jornada. Vamos!`,
    ctx.dreamProgress
      ? `${hello} ${Math.round(ctx.dreamProgress)}% do seu sonho já está construído. Bonito demais!`
      : `${hello} Comece com um passo pequeno — a comemoração vem logo depois.`,
    ctx.streakDays && ctx.streakDays > 1
      ? `${hello} ${ctx.streakDays} dias seguidos cuidando do futuro. Você está voando!`
      : `${hello} Guarde hoje e sinta a paz crescer na hora.`,
  ],
  pratico: (ctx, hello) => [
    `${hello} Registre seus lançamentos de ontem e separe seus 10%.`,
    `${hello} 2 minutos agora mantêm seu mês inteiro no ritmo.`,
    ctx.monthsOfPeace
      ? `${hello} Reserva atual: ${Math.floor(ctx.monthsOfPeace)} mês(es) de tranquilidade.`
      : `${hello} Comece pela reserva: ela é o seu primeiro escudo.`,
  ],
};

/** Mensagem final considerando o tom escolhido e a mensagem personalizada. */
export function reminderMessage(ctx: MorningContext, voice?: ReminderVoice) {
  const tone = voice?.tone ?? "sereno";
  if (tone === "personalizado" && voice?.customMessage?.trim()) {
    return voice.customMessage
      .replace(/\{nome\}/gi, ctx.name ?? "")
      .replace(/\{sonho\}/gi, ctx.dreamName ?? "seu sonho")
      .trim();
  }
  const hello = ctx.name ? `Bom dia, ${ctx.name}!` : "Bom dia!";
  const options = TONE_TEMPLATES[tone === "personalizado" ? "sereno" : tone](ctx, hello);
  return options[new Date().getDate() % options.length];
}

export function showReminderNotification(ctx: MorningContext, voice?: ReminderVoice) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    new Notification("AURIN · Chamado da manhã", {
      body: reminderMessage(ctx, voice),
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      tag: "aurin-morning",
    });
    return true;
  } catch {
    return false;
  }
}

/** O dia de hoje entra na frequência escolhida? */
export function isReminderDay(frequency: ReminderFrequency, days: number[], date = new Date()) {
  const dow = date.getDay();
  if (frequency === "diario") return true;
  if (frequency === "dias-uteis") return dow >= 1 && dow <= 5;
  if (frequency === "semanal") return dow === (days[0] ?? 1);
  return days.includes(dow);
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map((n) => Number(n) || 0);
  return h * 60 + m;
};

/** Estamos dentro da janela "não perturbe"? Funciona atravessando a meia-noite. */
export function inQuietHours(from: string, to: string, date = new Date()) {
  const now = date.getHours() * 60 + date.getMinutes();
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
}
