import { useEffect, useState } from "react";
import { Check, Crown, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePremiumSync } from "@/hooks/use-premium-sync";
import { supabase } from "@/integrations/supabase/client";
import { logEvent } from "@/lib/analytics.functions";
import {
  FREE_FEATURES,
  PAYMENT_OPTIONS,
  PREMIUM_FEATURES,
  PREMIUM_PRICE,
  buildCheckoutUrl,
  isCheckoutConfigured,
  type PaymentOptionId,
} from "@/lib/plan";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

type Cycle = "monthly" | "yearly";

/** Modal de vendas do Premium, com checkout da Hotmart. */
export function PremiumDialog({
  open,
  onOpenChange,
  highlight,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  highlight?: string;
}) {
  const plan = useAurinStore((s) => s.plan);
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [payment, setPayment] = useState<PaymentOptionId>("pix");
  const [waiting, setWaiting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const { check, checking } = usePremiumSync();

  useEffect(() => {
    if (!open) return;
    void logEvent({
      data: { event: "premium_view", meta: { highlight: highlight ?? "geral" } },
    }).catch(() => undefined);
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, [open, highlight]);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) window.setTimeout(() => setWaiting(false), 250);
  };

  const goToCheckout = () => {
    if (!isCheckoutConfigured(cycle)) {
      toast.error(
        "O checkout deste plano ainda não foi configurado. Cole o link da Hotmart em src/lib/plan.ts.",
      );
      return;
    }
    const url = buildCheckoutUrl(cycle, payment, email);
    if (!url) {
      toast.error("Não consegui montar o link de pagamento. Confira a URL da Hotmart.");
      return;
    }
    void logEvent({ data: { event: "checkout_click", meta: { cycle, payment } } }).catch(
      () => undefined,
    );
    window.open(url, "_blank", "noopener,noreferrer");
    setWaiting(true);
  };

  const confirmPayment = async () => {
    const result = await check();
    if (result.active) {
      void logEvent({ data: { event: "premium_activated", meta: { cycle } } }).catch(
        () => undefined,
      );
      toast.success("Premium liberado! Suas novas ferramentas já estão disponíveis.");
      close(false);
      return;
    }
    if (!result.signedIn) {
      toast.info(
        "Entre com o Google em “Minha conta” usando o mesmo e-mail da compra para liberar o Premium.",
      );
      return;
    }
    toast.info("Ainda não recebemos a confirmação da Hotmart. Tente de novo em instantes.");
  };

  const priceLabel = cycle === "yearly" ? PREMIUM_PRICE.yearlyLabel : PREMIUM_PRICE.monthlyLabel;

  if (plan === "premium") {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <div className="space-y-4 py-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold text-primary-foreground">
              <Crown className="h-8 w-8" />
            </span>
            <DialogTitle className="font-display text-2xl">Você já é Premium</DialogTitle>
            <DialogDescription>
              Simulador de Decisões, sonhos ilimitados e o Consultor de Paz estão liberados.
            </DialogDescription>
            <Button
              className="bg-gold text-primary-foreground hover:opacity-90"
              onClick={() => close(false)}
            >
              Começar a usar <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Crown className="h-3.5 w-3.5" /> AURIN Premium
            </p>
            <DialogTitle className="font-display text-2xl">
              Enxergue o futuro antes de decidir
            </DialogTitle>
            <DialogDescription>
              {highlight
                ? `“${highlight}” faz parte do Premium — e vem junto com tudo abaixo.`
                : "Ferramentas que transformam cada escolha de hoje em tranquilidade amanhã."}
            </DialogDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition-colors",
                cycle === "monthly"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              {cycle === "monthly" && (
                <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
              )}
              <p className="text-sm text-muted-foreground">Mensal</p>
              <p className="font-display text-2xl font-bold text-gold">
                {PREMIUM_PRICE.monthlyLabel}
              </p>
              <p className="text-xs text-muted-foreground">por mês, cancele quando quiser</p>
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={cn(
                "relative rounded-2xl border p-4 text-left transition-colors",
                cycle === "yearly"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="absolute right-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                2 meses grátis
              </span>
              <p className="text-sm text-muted-foreground">Anual</p>
              <p className="font-display text-2xl font-bold text-gold">
                {PREMIUM_PRICE.yearlyLabel}
              </p>
              <p className="text-xs text-muted-foreground">por ano, o melhor valor</p>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold">Sempre grátis</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Crown className="h-4 w-4" /> Com o Premium
              </p>
              <ul className="mt-2 space-y-2 text-xs">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.id}>
                    <p className="font-medium text-foreground">{f.name}</p>
                    <p className="text-muted-foreground">{f.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Como você prefere pagar?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  variant="outline"
                  className={cn(
                    "h-auto justify-start py-3",
                    payment === opt.id && "border-primary bg-primary/10",
                  )}
                  onClick={() => setPayment(opt.id)}
                >
                  <Crown
                    className={cn("h-4 w-4", payment === opt.id ? "text-gold" : "text-primary")}
                  />
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-medium">{opt.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {opt.hint}
                    </span>
                  </span>
                </Button>
              ))}
            </div>

            <Button
              className="mt-4 w-full bg-gold text-primary-foreground hover:opacity-90"
              onClick={goToCheckout}
            >
              Continuar para pagamento — {priceLabel}
              <ExternalLink className="h-4 w-4" />
            </Button>

            {!isCheckoutConfigured(cycle) && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Link do checkout {cycle === "yearly" ? "anual" : "mensal"} ainda não configurado.
                Cole a URL da Hotmart em <code>src/lib/plan.ts</code>.
              </p>
            )}

            {waiting && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
                <p className="text-sm font-semibold text-primary">
                  Concluiu o pagamento na Hotmart?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assim que a compra for aprovada, o Premium é liberado sozinho. Use o mesmo e-mail
                  da sua conta AURIN{email ? ` (${email})` : ""}.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={checking}
                  onClick={confirmPayment}
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Já paguei, verificar agora
                </Button>
              </div>
            )}

            {!email && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Dica: entre com o Google em “Minha conta” antes de pagar — assim o Premium acompanha
                você em qualquer aparelho.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
