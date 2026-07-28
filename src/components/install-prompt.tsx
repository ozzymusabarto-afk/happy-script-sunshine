import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "aurin-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Convite discreto para levar o AURIN à tela de início do celular. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    if (isIos) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-primary/25 bg-card/95 p-3 shadow-lg backdrop-blur lg:inset-x-auto lg:right-6 lg:bottom-6 lg:max-w-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Leve o AURIN com você</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {iosHint
              ? "Toque em Compartilhar e escolha “Adicionar à Tela de Início”."
              : "Instale na tela de início e abra sua jornada em um toque."}
          </p>
          {!iosHint && deferred && (
            <Button
              size="sm"
              className="mt-3 bg-gold text-primary-foreground hover:opacity-90"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                close();
              }}
            >
              <Download className="h-4 w-4" /> Instalar agora
            </Button>
          )}
          {iosHint && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              <Share className="h-3.5 w-3.5" /> Compartilhar → Adicionar à Tela de Início
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Dispensar" onClick={close}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
