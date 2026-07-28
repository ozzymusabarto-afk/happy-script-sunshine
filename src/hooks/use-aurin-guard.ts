import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_REMINDER_TIME,
  morningMessage,
  msUntil,
  notificationsSupported,
  showMorningNotification,
  todayKey,
  type MorningContext,
} from "@/lib/notifications";

/**
 * Dispara o chamado da manhã uma vez por dia. Se a notificação não estiver
 * disponível (iOS no navegador), a mensagem aparece ao abrir o app.
 */
export function useMorningReminder(
  enabled: boolean,
  time: string | undefined,
  lastShown: string | null,
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

  useEffect(() => {
    if (!enabled) return;
    const at = time || DEFAULT_REMINDER_TIME;
    let timer: number | undefined;

    const fire = () => {
      const day = todayKey();
      if (lastShown === day) return;
      const sent = notificationsSupported() && showMorningNotification(ctxRef.current);
      if (!sent) fallbackRef.current(morningMessage(ctxRef.current));
      markRef.current(day);
    };

    // Se já passou do horário hoje e ainda não mostramos, mostra ao abrir.
    const [h, m] = at.split(":").map((n) => Number(n) || 0);
    const now = new Date();
    const passed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
    if (passed) fire();

    timer = window.setTimeout(fire, msUntil(at));
    return () => window.clearTimeout(timer);
  }, [enabled, time, lastShown]);
}

/** Controla se a tela de bloqueio deve aparecer, respeitando o tempo escolhido. */
export function useAppLock(hasPin: boolean, autoLockMinutes: number, hydrated: boolean) {
  const [locked, setLocked] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
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
