import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_REMINDER_TIME,
  inQuietHours,
  isReminderDay,
  msUntil,
  notificationsSupported,
  reminderMessage,
  showReminderNotification,
  todayKey,
  type MorningContext,
  type ReminderFrequency,
  type ReminderTone,
} from "@/lib/notifications";

export interface ReminderConfig {
  enabled: boolean;
  time: string;
  lastShown: string | null;
  frequency: ReminderFrequency;
  days: number[];
  tone: ReminderTone;
  customMessage: string | null;
  quietEnabled: boolean;
  quietFrom: string;
  quietTo: string;
}

/**
 * Dispara o chamado da manhã no ritmo escolhido, respeitando o "não perturbe".
 * Se a notificação não estiver disponível (iOS no navegador), a mensagem
 * aparece ao abrir o app.
 */
export function useMorningReminder(
  config: ReminderConfig,
  ctx: MorningContext,
  markShown: (day: string) => void,
  fallback: (message: string) => void,
) {
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const markRef = useRef(markShown);
  markRef.current = markShown;
  const cfgRef = useRef(config);
  cfgRef.current = config;

  const {
    enabled,
    time,
    lastShown,
    frequency,
    quietEnabled,
    quietFrom,
    quietTo,
  } = config;
  const daysKey = config.days.join(",");

  useEffect(() => {
    if (!enabled) return;
    const at = time || DEFAULT_REMINDER_TIME;
    const voice = { tone: cfgRef.current.tone, customMessage: cfgRef.current.customMessage };

    const fire = () => {
      const cfg = cfgRef.current;
      const day = todayKey();
      if (cfg.lastShown === day) return;
      if (!isReminderDay(cfg.frequency, cfg.days)) return;
      if (cfg.quietEnabled && inQuietHours(cfg.quietFrom, cfg.quietTo)) return;
      const sent =
        notificationsSupported() && showReminderNotification(ctxRef.current, voice);
      if (!sent) fallbackRef.current(reminderMessage(ctxRef.current, voice));
      markRef.current(day);
    };

    // Se já passou do horário hoje e ainda não mostramos, mostra ao abrir.
    const [h, m] = at.split(":").map((n) => Number(n) || 0);
    const now = new Date();
    const passed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
    if (passed) fire();

    const timer = window.setTimeout(fire, msUntil(at));
    return () => window.clearTimeout(timer);
  }, [enabled, time, lastShown, frequency, daysKey, quietEnabled, quietFrom, quietTo]);
}

/** Controla se a tela de bloqueio deve aparecer, respeitando o tempo escolhido. */
export function useAppLock(hasPin: boolean, autoLockMinutes: number, hydrated: boolean) {
  const [locked, setLocked] = useState(false);
  const hiddenAt = useRef<number | null>(null);
  const checkedOnLoad = useRef(false);

  useEffect(() => {
    // Só bloqueia na abertura do app. Criar o PIN durante a sessão não tranca ninguém.
    if (!hydrated || checkedOnLoad.current) return;
    checkedOnLoad.current = true;
    setLocked(hasPin);
  }, [hydrated, hasPin]);


  useEffect(() => {
    if (!hasPin) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        return;
      }
      const away = hiddenAt.current ? (Date.now() - hiddenAt.current) / 60000 : 0;
      if (autoLockMinutes === 0 || away >= autoLockMinutes) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [hasPin, autoLockMinutes]);

  return { locked, unlock: () => setLocked(false) };
}
