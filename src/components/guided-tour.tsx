import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Pause, Play, Sparkles } from "lucide-react";
import { create } from "zustand";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TOUR_SLIDES } from "@/lib/tour-content";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

interface TourUi {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const useTourUi = create<TourUi>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

/** Abre o tutorial guiado de qualquer lugar do app. */
export const openGuidedTour = () => useTourUi.getState().setOpen(true);

/** Botão pronto para abrir o tutorial. */
export function TourButton({
  className,
  variant = "outline",
  label = "Ver o tutorial guiado",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  label?: string;
}) {
  return (
    <Button type="button" variant={variant} className={className} onClick={openGuidedTour}>
      <Sparkles className="h-4 w-4" /> {label}
    </Button>
  );
}

const AUTOPLAY_MS = 9000;

/** Tutorial em slides: sequência lógica do primeiro uso, com pular e rever. */
export function GuidedTour() {
  const open = useTourUi((s) => s.open);
  const setOpen = useTourUi((s) => s.setOpen);
  const markTourSeen = useAurinStore((s) => s.markTourSeen);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const total = TOUR_SLIDES.length;
  const slide = TOUR_SLIDES[step];

  const close = useCallback(() => {
    markTourSeen();
    setPlaying(false);
    setOpen(false);
  }, [markTourSeen, setOpen]);

  const next = useCallback(() => {
    setStep((s) => {
      if (s + 1 >= total) {
        setPlaying(false);
        return s;
      }
      return s + 1;
    });
  }, [total]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  // Reabrir sempre começa do primeiro slide.
  useEffect(() => {
    if (open) {
      setStep(0);
      setPlaying(false);
    }
  }, [open]);

  // Modo "assistir": avança sozinho, com pausa.
  useEffect(() => {
    if (!open || !playing) return;
    const id = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [open, playing, step, next]);

  // Navegação por teclado.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  const last = step === total - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-4 overflow-hidden">
        <div className="shrink-0 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{slide.kicker}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pausar tutorial" : "Assistir automaticamente"}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pausar" : "Assistir"}
            </Button>
          </div>
          <DialogTitle className="font-display text-2xl">{slide.title}</DialogTitle>
          <DialogDescription>{slide.why}</DialogDescription>
        </div>

        <Progress value={((step + 1) / total) * 100} className="h-1.5 shrink-0" />

        <div key={slide.id} className="reveal-step min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {slide.todo.map((t, i) => (
              <li key={t} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>

          {slide.note && (
            <p className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 text-sm text-primary">
              {slide.note}
            </p>
          )}

          {slide.action && (
            <Button asChild variant="outline" className="w-full" onClick={close}>
              <Link to={slide.action.to as never}>{slide.action.label}</Link>
            </Button>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-center gap-1.5">
            {TOUR_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir para o passo ${i + 1}`}
                onClick={() => {
                  setPlaying(false);
                  setStep(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="ghost" onClick={prev}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            ) : (
              <Button variant="ghost" className="text-muted-foreground" onClick={close}>
                Pular tutorial
              </Button>
            )}

            {last ? (
              <Button className="bg-gold text-primary-foreground hover:opacity-90" onClick={close}>
                <Check className="h-4 w-4" /> Entendi, vamos começar
              </Button>
            ) : (
              <Button
                className="bg-gold text-primary-foreground hover:opacity-90"
                onClick={() => {
                  setPlaying(false);
                  next();
                }}
              >
                Avançar <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
