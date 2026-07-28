import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  to?: string;
  className?: string;
}

/** Estado vazio acolhedor: convida a digitar em vez de mostrar zeros frios. */
export function EmptyState({
  icon,
  title,
  description,
  hint,
  actionLabel,
  onAction,
  to,
  className,
}: Props) {
  return (
    <Card className={cn("border-dashed border-primary/30 bg-primary/[0.04]", className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          {icon}
        </span>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {actionLabel &&
          (to ? (
            <Button asChild className="mt-1 bg-gold text-primary-foreground hover:opacity-90">
              <Link to={to}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button
              onClick={onAction}
              className="mt-1 bg-gold text-primary-foreground hover:opacity-90"
            >
              {actionLabel}
            </Button>
          ))}
        {hint && <p className="max-w-sm text-xs italic text-muted-foreground">"{hint}"</p>}
      </CardContent>
    </Card>
  );
}
