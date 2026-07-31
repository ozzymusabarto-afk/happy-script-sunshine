import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Confirma no servidor se quem chamou é administrador. Nunca confie no cliente. */
export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (error) {
      console.error("[admin] verificação de papel falhou");
      return { admin: false as const };
    }
    return { admin: Boolean(data) };
  });

export type AdminMetrics = {
  accounts: number;
  accounts_new_7d: number;
  accounts_new_30d: number;
  cloud_backups: number;
  premium_active: number;
  premium_inactive: number;
  premium_monthly: number;
  premium_yearly: number;
  opens_today: number;
  opens_7d: number;
  opens_30d: number;
  premium_views: number;
  checkout_clicks: number;
  activations: number;
};

/** Números do app para o painel do guardião. A própria função no banco valida o papel. */
export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_metrics");
    if (error) {
      console.error("[admin] leitura de métricas falhou");
      throw new Error("Não consegui ler os números agora.");
    }
    return { metrics: data as unknown as AdminMetrics };
  });

/** Lista os últimos registros de assinatura. Só administradores conseguem ler. */
export const listPremiumStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!admin) throw new Error("Forbidden");

    const { data, error } = await context.supabase
      .from("premium_status")
      .select("email, plan, active, approved_at, expires_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[admin] leitura de assinaturas falhou");
      throw new Error("Não consegui ler as assinaturas agora.");
    }
    return { rows: data ?? [] };
  });

/** Libera ou revoga o Premium de um e-mail manualmente. */
export const setPremiumForEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; active: boolean; plan?: "monthly" | "yearly" }) => {
    const email = String(input.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      throw new Error("E-mail inválido.");
    }
    return {
      email,
      active: Boolean(input.active),
      plan: input.plan === "yearly" ? ("yearly" as const) : ("monthly" as const),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!admin) throw new Error("Forbidden");

    const { data: userId } = await context.supabase.rpc("user_id_for_email", {
      _email: data.email,
    });

    const { error } = await context.supabase.from("premium_status").upsert(
      {
        email: data.email,
        user_id: userId ?? null,
        plan: data.plan,
        active: data.active,
        approved_at: data.active ? new Date().toISOString() : null,
        expires_at: null,
        transaction: "manual-admin",
      },
      { onConflict: "email" },
    );

    if (error) {
      console.error("[admin] gravação de assinatura falhou");
      throw new Error("Não consegui salvar a assinatura agora.");
    }
    return { ok: true as const, email: data.email, active: data.active };
  });
