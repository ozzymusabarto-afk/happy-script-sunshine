import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/** Eventos permitidos. Nada fora desta lista é gravado. */
const ALLOWED = [
  "app_open",
  "signin",
  "premium_view",
  "checkout_click",
  "premium_activated",
  "onboarding_done",
] as const;

type AllowedEvent = (typeof ALLOWED)[number];

function isAllowed(value: string): value is AllowedEvent {
  return (ALLOWED as readonly string[]).includes(value);
}

/**
 * Registra um evento leve de uso (sem nenhum dado financeiro).
 * Quando existe sessão, guardamos também a conta para o painel do guardião.
 */
export const logEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { event: string; meta?: Record<string, string | number | boolean> }) => {
    const event = String(input.event ?? "").trim();
    if (!isAllowed(event)) throw new Error("Evento não reconhecido.");
    const meta: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(input.meta ?? {}).slice(0, 8)) {
      if (typeof value === "string") meta[key.slice(0, 40)] = value.slice(0, 80);
      else if (typeof value === "number" || typeof value === "boolean") meta[key.slice(0, 40)] = value;
    }
    return { event, meta };
  })
  .handler(async ({ data }) => {
    let userId: string | null = null;
    let email: string | null = null;

    const authHeader = getRequestHeader("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token && token.split(".").length === 3) {
      const SUPABASE_URL = process.env["SUPABASE_URL"];
      const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
      if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData } = await client.auth.getClaims(token);
        const claims = claimsData?.claims as { sub?: string; email?: string } | undefined;
        userId = claims?.sub ?? null;
        email = claims?.email?.trim().toLowerCase() ?? null;
      }
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("app_events").insert({
        user_id: userId,
        email,
        event: data.event,
        meta: data.meta as never,
      });
    } catch {
      console.error("[analytics] registro de evento falhou");
    }

    return { ok: true as const };
  });
