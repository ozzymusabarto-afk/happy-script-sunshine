import { useState } from "react";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FREE_FEATURES,
  PAYMENT_OPTIONS,
  PREMIUM_FEATURES,
  PREMIUM_PRICE,
  type PaymentOptionId,
} from "@/lib/plan";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

type Cycle = "monthly" | "yearly";

/** Modal de vendas do Premium, com simulação de pagamento. */
export function PremiumDialog({
  open,
  onOpenChange,
  highlight,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  highlight?: string;
}) {
  const setPlan = useAurinStore((s) => s.setPlan);
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [paying, setPaying] = useState<PaymentOptionId | null>(null);
  const [done, setDone] = useState(false);

  const simulate = (id: PaymentOptionId) => {
    setPaying(id);
    window.setTimeout(() => {
      setPaying(null);
      setDone(true);
      setPlan("premium");
      toast.success("Premium liberado! Suas novas ferramentas já estão disponíveis.");
    }, 1400);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) window.setTimeout(() => setDone(false), 250);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold text-primary-foreground">
              <Crown className="h-8 w-8" />
            </span>
            <DialogTitle className="font-display text-2xl">Bem-vindo ao Premium</DialogTitle>
            <DialogDescription>
              Simulador de Decisões, sonhos ilimitados e o Consultor de Paz já estão liberados
              neste aparelho.
            </DialogDescription>
            <Button
              className="bg-gold text-primary-foreground hover:opacity-90"
              onClick={() => close(false)}
            >
              Começar a usar <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        ) : (
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
                  "rounded-2xl border p-4 text-left transition-colors",
                  cycle === "monthly"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40",
                )}
              >
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
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    variant="outline"
                    disabled={paying !== null}
                    className="h-auto justify-start py-3"
                    onClick={() => simulate(opt.id)}
                  >
                    {paying === opt.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4 text-primary" />
                    )}
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm font-medium">
                        {paying === opt.id ? "Processando…" : opt.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {opt.hint}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Demonstração: nenhum valor é cobrado. O Premium é liberado neste aparelho para
                você experimentar {cycle === "yearly" ? "o plano anual" : "o plano mensal"}.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
