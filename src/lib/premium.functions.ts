import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StatusRow = { active: boolean; plan: string | null; expires_at: string | null };

const INACTIVE = { active: false as const, plan: null, expiresAt: null };

/**
 * Consulta o status Premium do usuário logado.
 * A RLS já isola a linha, mas filtramos explicitamente por conta/e-mail
 * como defesa em profundidade.
 */
export const getPremiumStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as { email?: string } | undefined;
    const email = claims?.email?.trim().toLowerCase() ?? null;

    // Guardião do app: acesso completo para testar tudo, decidido no servidor.
    const { data: admin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (admin) {
      return { active: true as const, plan: "admin", expiresAt: null };
    }

    const byUser = await context.supabase
      .from("premium_status")
      .select("active, plan, expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (byUser.error) {
      console.error("[premium] status read failed");
      return INACTIVE;
    }

    let row: StatusRow | null = byUser.data ?? null;

    if (!row && email) {
      const byEmail = await context.supabase
        .from("premium_status")
        .select("active, plan, expires_at")
        .eq("email", email)
        .maybeSingle();

      if (byEmail.error) {
        console.error("[premium] status read failed");
        return INACTIVE;
      }
      row = byEmail.data ?? null;
    }

    if (!row) return INACTIVE;

    const expired = row.expires_at != null && new Date(row.expires_at).getTime() < Date.now();

    return {
      active: Boolean(row.active) && !expired,
      plan: row.plan ?? null,
      expiresAt: row.expires_at ?? null,
    };
  });
