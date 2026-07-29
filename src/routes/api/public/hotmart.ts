import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook da Hotmart.
 *
 * Configure na Hotmart em: Ferramentas > Webhook (Postback) apontando para
 *   https://SEU-DOMINIO/api/public/hotmart
 * e defina o mesmo token secreto que está salvo em HOTMART_WEBHOOK_TOKEN.
 */

type HotmartPayload = {
  event?: string;
  hottok?: string;
  data?: {
    buyer?: { email?: string; name?: string };
    purchase?: {
      transaction?: string;
      approved_date?: number;
      status?: string;
      recurrence_number?: number;
      offer?: { code?: string };
      price?: { value?: number };
    };
    subscription?: { plan?: { name?: string } };
  };
};

const APPROVE_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_CANCELED",
  "PURCHASE_EXPIRED",
  "SUBSCRIPTION_CANCELLATION",
]);

function planFromPayload(payload: HotmartPayload): "monthly" | "yearly" {
  const name =
    payload.data?.subscription?.plan?.name ??
    payload.data?.purchase?.offer?.code ??
    "";
  return /anual|year|annual/i.test(name) ? "yearly" : "monthly";
}

export const Route = createFileRoute("/api/public/hotmart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HOTMART_WEBHOOK_TOKEN;
        if (!secret) {
          console.error("[hotmart] HOTMART_WEBHOOK_TOKEN não configurado");
          return new Response("Not configured", { status: 500 });
        }

        const raw = await request.text();
        let payload: HotmartPayload;
        try {
          payload = JSON.parse(raw) as HotmartPayload;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const token =
          request.headers.get("x-hotmart-hottok") ??
          request.headers.get("X-HOTMART-HOTTOK") ??
          payload.hottok ??
          "";

        if (token !== secret) {
          return new Response("Invalid token", { status: 401 });
        }

        const event = payload.event ?? "";
        const email = payload.data?.buyer?.email?.trim().toLowerCase();
        if (!email) {
          return new Response("Missing buyer email", { status: 400 });
        }

        const approving = APPROVE_EVENTS.has(event);
        const revoking = REVOKE_EVENTS.has(event);
        if (!approving && !revoking) {
          return new Response("Ignored", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const plan = planFromPayload(payload);
        const approvedAt = payload.data?.purchase?.approved_date
          ? new Date(payload.data.purchase.approved_date).toISOString()
          : new Date().toISOString();

        const { error } = await supabaseAdmin.from("premium_status").upsert(
          {
            email,
            plan,
            active: approving,
            transaction: payload.data?.purchase?.transaction ?? null,
            approved_at: approving ? approvedAt : null,
            expires_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );

        if (error) {
          console.error("[hotmart] upsert failed", error.message);
          return new Response("Storage error", { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
