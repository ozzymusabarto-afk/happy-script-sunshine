import { useState, type ReactNode } from "react";
import { Crown } from "lucide-react";

import { PremiumDialog } from "@/components/premium-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

export function useIsPremium() {
  return useAurinStore((s) => s.plan === "premium");
}

/** Botão elegante para abrir o modal de vendas. */
export function PremiumButton({
  className,
  label = "Seja Premium",
  feature,
}: {
  className?: string;
  label?: string;
  feature?: string;
}) {
  const [open, setOpen] = useState(false);
  const premium = useIsPremium();
  if (premium) return null;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
          className,
        )}
      >
        <Crown className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </Button>
      <PremiumDialog open={open} onOpenChange={setOpen} highlight={feature} />
    </>
  );
}

/**
 * Envolve um recurso Premium: quando o plano é grátis, mostra o conteúdo
 * desfocado com a coroa dourada e abre o modal de vendas ao toque.
 */
export function PremiumGate({
  feature,
  title,
  description,
  children,
  className,
}: {
  feature: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  const premium = useIsPremium();
  const [open, setOpen] = useState(false);

  if (premium) return <>{children}</>;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <div aria-hidden className="pointer-events-none select-none blur-[6px] saturate-50">
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute inset-0 grid place-items-center bg-background/70 p-4 text-center backdrop-blur-[2px] transition-colors hover:bg-background/60"
      >
        <span className="max-w-sm space-y-2">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gold text-primary-foreground">
            <Crown className="h-5 w-5" />
          </span>
          <span className="block font-display text-lg font-bold">{title}</span>
          <span className="block text-sm text-muted-foreground">{description}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Crown className="h-3.5 w-3.5" /> Desbloquear com o Premium
          </span>
        </span>
      </button>
      <PremiumDialog open={open} onOpenChange={setOpen} highlight={feature} />
    </div>
  );
}
