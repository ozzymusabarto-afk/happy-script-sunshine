import { useEffect, useMemo, useState } from "react";
import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cooldownSeconds,
  hashPin,
  newSalt,
  verifyBiometrics,
  verifyPin,
  verifyRecoveryPhrase,
} from "@/lib/security";
import { userSymbol } from "@/lib/symbols";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const security = useAurinStore((s) => s.security);
  const name = useAurinStore((s) => s.profile.name);
  const symbol = useAurinStore((s) => s.profile.symbol);
  const SymbolIcon = userSymbol(symbol).icon;
  const clearAll = useAurinStore((s) => s.clearAll);
  const disableLock = useAurinStore((s) => s.disableLock);
  const setSecurity = useAurinStore((s) => s.setSecurity);

  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [wait, setWait] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [newPin, setNewPin] = useState("");

  const blocked = wait > 0;

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => window.clearInterval(t);
  }, [wait]);

  const tryBiometrics = useMemo(
    () => async () => {
      if (!security.biometricId) return;
      const ok = await verifyBiometrics(security.biometricId);
      if (ok) onUnlock();
      else setError("Não reconheci sua digital. Você pode usar o PIN.");
    },
    [security.biometricId, onUnlock],
  );

  useEffect(() => {
    if (security.biometricId) void tryBiometrics();
  }, [security.biometricId, tryBiometrics]);

  const submit = async (value: string) => {
    if (!security.pinHash || !security.salt) {
      onUnlock();
      return;
    }
    setChecking(true);
    const ok = await verifyPin(value, security.salt, security.pinHash);
    setChecking(false);
    if (ok) {
      setAttempts(0);
      onUnlock();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setWait(cooldownSeconds(next));
    setPin("");
    setError("PIN não confere. Respire e tente de novo.");
  };

  const recover = async () => {
    if (!security.recoveryHash || !security.recoverySalt) return;
    if (newPin.length < 4) {
      setError("Escolha um novo PIN de 4 a 6 números.");
      return;
    }
    setChecking(true);
    const ok = await verifyRecoveryPhrase(phrase, security.recoverySalt, security.recoveryHash);
    if (!ok) {
      setChecking(false);
      setError("Essa frase não confere. Confira as 12 palavras, na ordem.");
      return;
    }
    const salt = newSalt();
    const pinHash = await hashPin(newPin, salt);
    setSecurity({ pinHash, salt });
    setChecking(false);
    onUnlock();
  };

  const press = (k: string) => {
    if (blocked || checking) return;
    setError(null);
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!k) return;
    const next = (pin + k).slice(0, 6);
    setPin(next);
    if (next.length >= 4 && next.length === 6) void submit(next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold text-primary-foreground">
        <SymbolIcon className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-extrabold">
        {name ? `Bem-vindo de volta, ${name}` : "Bem-vindo de volta"}
      </h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Seu templo está protegido. Digite seu PIN para entrar.
      </p>

      <div className="mt-7 flex items-center gap-3" aria-label="PIN digitado">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-3 rounded-full border border-border transition-colors",
              i < pin.length ? "border-primary bg-gold" : "bg-transparent",
            )}
          />
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-muted-foreground">{error}</p>}
      {blocked && (
        <p className="mt-2 text-sm text-muted-foreground">
          Vamos esperar {wait}s antes da próxima tentativa.
        </p>
      )}

      <div className="mt-7 grid w-full max-w-[260px] grid-cols-3 gap-3">
        {KEYS.map((k, i) => (
          <button
            key={`${k}-${i}`}
            type="button"
            disabled={!k || blocked || checking}
            onClick={() => press(k)}
            className={cn(
              "h-14 rounded-2xl border border-border bg-card text-lg font-semibold transition-colors",
              k ? "hover:bg-accent" : "invisible",
              (blocked || checking) && "opacity-50",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-2">
        <Button
          className="bg-gold text-primary-foreground hover:opacity-90"
          disabled={pin.length < 4 || blocked || checking}
          onClick={() => void submit(pin)}
        >
          Entrar
        </Button>
        {security.biometricId && (
          <Button variant="ghost" onClick={() => void tryBiometrics()}>
            <Fingerprint className="h-4 w-4" /> Usar biometria
          </Button>
        )}
        {security.recoveryHash ? (
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setRecovering(true);
              setError(null);
            }}
          >
            Esqueci meu PIN
          </button>
        ) : (
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              const ok = window.confirm(
                "Sem o PIN e sem frase de recuperação não é possível abrir seus dados. Deseja recomeçar do zero neste aparelho? Tudo será apagado.",
              );
              if (ok) {
                clearAll();
                disableLock();
                onUnlock();
              }
            }}
          >
            Esqueci meu PIN
          </button>
        )}
      </div>

      {recovering && (
        <div className="mt-6 w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4 text-primary" /> Recuperar acesso
          </p>
          <p className="text-xs text-muted-foreground">
            Digite sua frase de 12 palavras e escolha um novo PIN. Seus dados continuam neste
            aparelho — nada é exposto.
          </p>
          <Textarea
            rows={3}
            placeholder="ouro paz rio monte..."
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          <input
            inputMode="numeric"
            type="password"
            maxLength={6}
            placeholder="Novo PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
          <div className="flex gap-2">
            <Button
              className="bg-gold text-primary-foreground hover:opacity-90"
              disabled={checking || phrase.trim().length < 10 || newPin.length < 4}
              onClick={() => void recover()}
            >
              Recuperar e entrar
            </Button>
            <Button variant="ghost" onClick={() => setRecovering(false)}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 flex max-w-xs items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Seus dados ficam apenas neste aparelho.
      </p>
    </div>
  );
}
