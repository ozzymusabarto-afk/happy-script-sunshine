import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Webhook da Hotmart.
 *
 * Configure na Hotmart em: Ferramentas > Webhook (Postback) apontando para
 *   https://SEU-DOMINIO/api/public/hotmart
 * e defina o mesmo token secreto que está salvo em HOTMART_WEBHOOK_TOKEN.
 */

const MAX_BODY_BYTES = 64 * 1024;

const payloadSchema = z.object({
  event: z.string().max(120).optional(),
  hottok: z.string().max(512).optional(),
  data: z
    .object({
      buyer: z.object({ email: z.string().email().max(320).optional() }).partial().optional(),
      purchase: z
        .object({
          transaction: z.string().max(120).optional(),
          approved_date: z.number().int().nonnegative().optional(),
          offer: z.object({ code: z.string().max(120).optional() }).partial().optional(),
        })
        .partial()
        .optional(),
      subscription: z
        .object({ plan: z.object({ name: z.string().max(200).optional() }).partial().optional() })
        .partial()
        .optional(),
    })
    .partial()
    .optional(),
});

type HotmartPayload = z.infer<typeof payloadSchema>;

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
    payload.data?.subscription?.plan?.name ?? payload.data?.purchase?.offer?.code ?? "";
  return /anual|year|annual/i.test(name) ? "yearly" : "monthly";
}

/** Resposta genérica: nunca revela por que a requisição foi recusada. */
const rejected = () => new Response("Rejected", { status: 400 });

export const Route = createFileRoute("/api/public/hotmart")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HOTMART_WEBHOOK_TOKEN;
        if (!secret) {
          console.error("[hotmart] webhook token não configurado");
          return rejected();
        }

        const declared = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return rejected();

        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return rejected();

        let payload: HotmartPayload;
        try {
          payload = payloadSchema.parse(JSON.parse(raw));
        } catch {
          return rejected();
        }

        const token =
          request.headers.get("x-hotmart-hottok") ??
          request.headers.get("X-HOTMART-HOTTOK") ??
          payload.hottok ??
          "";

        if (token !== secret) return rejected();

        const event = payload.event ?? "";
        const email = payload.data?.buyer?.email?.trim().toLowerCase();
        if (!email) return rejected();

        const approving = APPROVE_EVENTS.has(event);
        const revoking = REVOKE_EVENTS.has(event);
        if (!approving && !revoking) return Response.json({ ok: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Vincula à conta quando o comprador já existe; e-mail fica como fallback.
        const { data: userId } = await supabaseAdmin.rpc("user_id_for_email", {
          _email: email,
        });

        const plan = planFromPayload(payload);
        const approvedAt = payload.data?.purchase?.approved_date
          ? new Date(payload.data.purchase.approved_date).toISOString()
          : new Date().toISOString();

        const { error } = await supabaseAdmin.from("premium_status").upsert(
          {
            email,
            user_id: (userId as string | null) ?? null,
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
          console.error("[hotmart] falha ao gravar status premium");
          return new Response("Rejected", { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
