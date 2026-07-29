import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Consulta o status Premium do usuário logado.
 * A RLS já filtra pelo e-mail da conta, então basta ler a própria linha.
 */
export const getPremiumStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("premium_status")
      .select("active, plan, expires_at")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[premium] status read failed", error.message);
      return { active: false as const, plan: null, expiresAt: null };
    }

    const expired =
      data?.expires_at != null && new Date(data.expires_at).getTime() < Date.now();

    return {
      active: Boolean(data?.active) && !expired,
      plan: data?.plan ?? null,
      expiresAt: data?.expires_at ?? null,
    };
  });
