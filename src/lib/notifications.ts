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
    const meses = ctx.monthsOfPeace < 1 ? "algumas semanas" : `${Math.floor(ctx.monthsOfPeace)} mês(es)`;
    options.push(`${hello} Você já comprou ${meses} de tranquilidade. Vamos somar mais um pouco hoje?`);
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
