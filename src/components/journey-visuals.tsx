import { Check, Coins, Lock, Sparkles, Trophy } from "lucide-react";

import { GoldCounter } from "@/components/gold-counter";
import { Badge } from "@/components/ui/badge";
import { brl, brlCompact } from "@/lib/aurin";
import { cn } from "@/lib/utils";

/* ------------------------------ trilha da jornada ----------------------------- */

export interface TrailStop {
  key: string;
  label: string;
  saved: number;
  balance: number;
}

/**
 * Substitui o gráfico de linhas: cada mês vira uma parada na trilha,
 * conquistada (ouro guardado) ou perdida.
 */
export function JourneyTrail({ stops }: { stops: TrailStop[] }) {
  const best = Math.max(1, ...stops.map((s) => s.saved));
  const wins = stops.filter((s) => s.saved > 0).length;

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {wins} de {stops.length} meses com ouro guardado
        </p>
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Trophy className="mr-1 h-3 w-3" />
          Sequência viva
        </Badge>
      </div>

      <div className="relative mt-6 overflow-x-auto pb-2">
        <div className="relative flex min-w-max items-end gap-3 sm:gap-5">
          <span
            aria-hidden
            className="absolute bottom-11 left-2 right-2 h-0.5 rounded-full bg-border"
          />
          {stops.map((stop, i) => {
            const won = stop.saved > 0;
            const height = 26 + (stop.saved / best) * 62;
            return (
              <div
                key={stop.key}
                className="reveal-step relative flex w-12 flex-col items-center sm:w-16"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span
                  className={cn(
                    "mb-2 text-[11px] font-semibold",
                    won ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {won ? brlCompact(stop.saved) : "—"}
                </span>
                <span
                  className={cn(
                    "w-8 rounded-t-full transition-all sm:w-10",
                    won ? "bg-gold shadow-gold" : "bg-secondary",
                  )}
                  style={{ height: won ? height : 18 }}
                />
                <span
                  className={cn(
                    "z-10 mt-2 grid h-7 w-7 place-items-center rounded-full border-2",
                    won
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {won ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
                </span>
                <span className="mt-2 text-[11px] capitalize text-muted-foreground">
                  {stop.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- cofres/vasos -------------------------------- */

export interface VaultItem {
  id: string;
  name: string;
  balance: number;
  target: number;
  hint?: string;
}

/** Vasos de ouro que enchem conforme o sonho avança — substitui barras frias. */
export function VaultJar({ item, delay = 0 }: { item: VaultItem; delay?: number }) {
  const pct = item.target > 0 ? Math.min(100, (item.balance / item.target) * 100) : 0;
  const done = pct >= 100;

  return (
    <div className="panel reveal-step p-4" style={{ animationDelay: `${delay}s` }}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <div
          className={cn(
            "relative h-20 w-14 shrink-0 overflow-hidden rounded-b-[1.6rem] rounded-t-lg border-2",
            done ? "border-primary" : "border-border",
          )}
          role="img"
          aria-label={`${item.name}: ${pct.toFixed(0)}% preenchido`}
        >
          <span
            className="vault-fill absolute inset-x-0 bottom-0 bg-gold"
            style={
              {
                height: `${pct}%`,
                "--fill-from": "0%",
                "--fill-to": `${pct}%`,
                animationDelay: `${delay}s`,
              } as React.CSSProperties
            }
          />
          {done && (
            <Sparkles className="gold-shimmer absolute inset-0 m-auto h-5 w-5 text-primary-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold">{item.name}</p>
          <p className="mt-0.5 font-display text-lg font-bold text-gold">
            <GoldCounter value={item.balance} />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {done
              ? "Sonho conquistado!"
              : (item.hint ?? `Faltam ${brl(Math.max(0, item.target - item.balance))}`)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-primary">{pct.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- corrente/dívida ------------------------------- */

/** Elos que se rompem conforme a dívida é paga. */
export function ChainProgress({
  percent,
  links = 10,
  className,
}: {
  percent: number;
  links?: number;
  className?: string;
}) {
  const broken = Math.round((Math.min(100, Math.max(0, percent)) / 100) * links);
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${percent.toFixed(0)}% da corrente rompida`}
    >
      {Array.from({ length: links }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-3 flex-1 rounded-full transition-colors",
            i < broken ? "bg-gold" : "bg-secondary",
            i === broken - 1 && "gold-shimmer",
          )}
        />
      ))}
    </div>
  );
}

/* --------------------------------- medidor livre -------------------------------- */

/** Meses de liberdade que o patrimônio garante hoje. */
export function FreedomMeter({ months, wealth }: { months: number; wealth: number }) {
  const pct = Math.min(100, (months / 12) * 100);
  return (
    <div className="panel p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Coins className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Liberdade acumulada
          </p>
          <p className="font-display text-xl font-bold text-gold">
            {months.toFixed(1)} meses sem trabalhar
          </p>
        </div>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
        <span className="block h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {brl(wealth)} em tesouro — meta simbólica: 12 meses de liberdade.
      </p>
    </div>
  );
}
