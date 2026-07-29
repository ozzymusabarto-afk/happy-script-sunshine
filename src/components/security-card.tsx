import { useEffect, useState } from "react";
import { BellRing, Copy, Fingerprint, KeyRound, Lock, MoonStar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FREQUENCY_LABELS,
  TONE_LABELS,
  WEEKDAY_LABELS,
  askNotificationPermission,
  notificationPermission,
  notificationsSupported,
  reminderMessage,
  showReminderNotification,
  type ReminderFrequency,
  type ReminderTone,
} from "@/lib/notifications";
import {
  biometricsSupported,
  generateRecoveryPhrase,
  hashPin,
  hashRecoveryPhrase,
  newSalt,
  registerBiometrics,
} from "@/lib/security";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

const AUTOLOCK_OPTIONS = [
  { value: "0", label: "Sempre que eu abrir" },
  { value: "1", label: "Depois de 1 minuto fora" },
  { value: "5", label: "Depois de 5 minutos fora" },
  { value: "15", label: "Depois de 15 minutos fora" },
  { value: "30", label: "Depois de 30 minutos fora" },
  { value: "60", label: "Depois de 1 hora fora" },
];

export function SecurityCard() {
  const security = useAurinStore((s) => s.security);
  const setSecurity = useAurinStore((s) => s.setSecurity);
  const disableLock = useAurinStore((s) => s.disableLock);
  const name = useAurinStore((s) => s.profile.name);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [canBio, setCanBio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);

  useEffect(() => {
    void biometricsSupported().then(setCanBio);
  }, []);

  const hasPin = Boolean(security.pinHash);

  const createPin = async () => {
    if (pin.length < 4) {
      toast.error("Escolha um PIN de 4 a 6 números.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Os dois PINs precisam ser iguais.");
      return;
    }
    setBusy(true);
    const salt = newSalt();
    const pinHash = await hashPin(pin, salt);
    setSecurity({ pinHash, salt });
    setBusy(false);
    setPin("");
    setConfirmPin("");
    toast.success("Bloqueio ativado. Seu templo agora abre só para você.");
  };

  const toggleBio = async (on: boolean) => {
    if (!on) {
      setSecurity({ biometricId: null });
      return;
    }
    setBusy(true);
    try {
      const id = await registerBiometrics(name || "AURIN");
      if (id) {
        setSecurity({ biometricId: id });
        toast.success("Biometria ativada neste aparelho.");
      } else {
        toast.error("Não consegui ativar a biometria agora.");
      }
    } catch {
      toast.error("Seu aparelho recusou o cadastro da biometria.");
    }
    setBusy(false);
  };

  const createRecovery = async () => {
    setBusy(true);
    const words = generateRecoveryPhrase(12);
    const recoverySalt = newSalt();
    const recoveryHash = await hashRecoveryPhrase(words, recoverySalt);
    setSecurity({ recoveryHash, recoverySalt, recoveryCreatedAt: new Date().toISOString() });
    setPhrase(words);
    setBusy(false);
    toast.success("Frase criada. Guarde-a em um lugar seguro.");
  };

  return (
    <Card className="reveal-step">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> Proteção do seu templo
        </CardTitle>
        <CardDescription>
          Seus dados ficam apenas neste aparelho e nunca são enviados sem você pedir. O PIN é
          guardado de forma cifrada — nem o AURIN consegue lê-lo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPin ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-pin">Criar PIN (4 a 6 números)</Label>
                <Input
                  id="s-pin"
                  inputMode="numeric"
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-pin2">Repetir PIN</Label>
                <Input
                  id="s-pin2"
                  inputMode="numeric"
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
            <Button
              disabled={busy || pin.length < 4}
              onClick={() => void createPin()}
              className="bg-gold text-primary-foreground hover:opacity-90"
            >
              <Lock className="h-4 w-4" /> Ativar bloqueio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Bloqueio por PIN ativo</p>
                <p className="text-xs text-muted-foreground">
                  Pedimos o PIN quando você volta ao AURIN.
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  disableLock();
                  toast.success("Bloqueio desativado.");
                }}
              >
                Desativar
              </Button>
            </div>

            {canBio && (
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Fingerprint className="h-4 w-4 text-primary" /> Usar biometria
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Digital ou Face ID deste aparelho para abrir mais rápido.
                  </p>
                </div>
                <Switch
                  checked={Boolean(security.biometricId)}
                  disabled={busy}
                  onCheckedChange={(v) => void toggleBio(v)}
                  aria-label="Usar biometria"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Quando pedir o PIN</Label>
              <Select
                value={String(security.autoLockMinutes)}
                onValueChange={(v) => setSecurity({ autoLockMinutes: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTOLOCK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escolha o tempo que faz sentido para o seu dia. Nada muda para quem está fora.
              </p>
            </div>

            {/* Recuperação de acesso */}
            <div className="space-y-3 rounded-xl border border-border p-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="h-4 w-4 text-primary" /> Se eu esquecer meu PIN
                </p>
                <p className="text-xs text-muted-foreground">
                  Crie uma frase de 12 palavras. Ela abre seu templo sem expor nada: guardamos
                  apenas o hash dela, nunca as palavras.
                </p>
              </div>

              {security.recoveryHash && !phrase && (
                <p className="text-xs text-primary">
                  Frase de recuperação ativa
                  {security.recoveryCreatedAt
                    ? ` desde ${new Date(security.recoveryCreatedAt).toLocaleDateString("pt-BR")}`
                    : ""}
                  .
                </p>
              )}

              {phrase && (
                <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    Anote agora — não mostraremos de novo.
                  </p>
                  <p className="font-mono text-sm leading-relaxed">{phrase}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(phrase)
                          .then(() => toast.success("Frase copiada."))
                          .catch(() => toast.error("Copie manualmente, por favor."));
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPhrase(null)}>
                      Já guardei
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="outline" disabled={busy} onClick={() => void createRecovery()}>
                <KeyRound className="h-4 w-4" />
                {security.recoveryHash ? "Gerar nova frase" : "Criar frase de recuperação"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReminderCard() {
  const reminder = useAurinStore((s) => s.reminder);
  const setReminder = useAurinStore((s) => s.setReminder);
  const profile = useAurinStore((s) => s.profile);
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setPermission(notificationPermission());
  }, []);

  const toggle = async (on: boolean) => {
    if (!on) {
      setReminder({ enabled: false });
      return;
    }
    const result = await askNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      setReminder({ enabled: true });
      toast.success("Combinado. Te chamo com carinho pela manhã.");
    } else if (result === "unsupported") {
      setReminder({ enabled: true });
      toast.success("Seu chamado da manhã vai aparecer ao abrir o AURIN.");
    } else {
      toast.error("Seu navegador não permitiu as notificações agora.");
    }
  };

  const toggleDay = (day: number) => {
    const has = reminder.days.includes(day);
    const next = has ? reminder.days.filter((d) => d !== day) : [...reminder.days, day].sort();
    setReminder({ days: next.length ? next : [day] });
  };

  const voice = { tone: reminder.tone, customMessage: reminder.customMessage };
  const ctx = { name: profile.name, dreamName: profile.dreamName, dreamProgress: 0 };

  return (
    <Card className="reveal-step">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-primary" /> Meu chamado da manhã
        </CardTitle>
        <CardDescription>
          Você escolhe o horário, o ritmo e as palavras. Nunca é cobrança — é lembrete de cuidado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">Receber o chamado</p>
            <p className="text-xs text-muted-foreground">
              {permission === "denied"
                ? "As notificações estão bloqueadas nas configurações do navegador."
                : "No horário e nos dias que você escolher."}
            </p>
          </div>
          <Switch
            checked={reminder.enabled}
            onCheckedChange={(v) => void toggle(v)}
            aria-label="Ativar chamado da manhã"
          />
        </div>

        {reminder.enabled && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rem-time">Horário</Label>
                <Input
                  id="rem-time"
                  type="time"
                  value={reminder.time}
                  onChange={(e) => setReminder({ time: e.target.value || "08:00" })}
                />
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={reminder.frequency}
                  onValueChange={(v) => setReminder({ frequency: v as ReminderFrequency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(reminder.frequency === "personalizado" || reminder.frequency === "semanal") && (
              <div className="space-y-2">
                <Label>
                  {reminder.frequency === "semanal" ? "Dia da semana" : "Dias que eu escolho"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, day) => {
                    const active =
                      reminder.frequency === "semanal"
                        ? reminder.days[0] === day
                        : reminder.days.includes(day);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          reminder.frequency === "semanal"
                            ? setReminder({ days: [day] })
                            : toggleDay(day)
                        }
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tom da mensagem</Label>
              <Select
                value={reminder.tone}
                onValueChange={(v) => setReminder({ tone: v as ReminderTone })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TONE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reminder.tone === "personalizado" && (
              <div className="space-y-2">
                <Label htmlFor="rem-msg">Minha mensagem</Label>
                <Textarea
                  id="rem-msg"
                  rows={3}
                  placeholder="Ex.: {nome}, hoje você constrói {sonho}. Guarde sua parte."
                  value={reminder.customMessage ?? ""}
                  onChange={(e) => setReminder({ customMessage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use <span className="font-mono">{"{nome}"}</span> e{" "}
                  <span className="font-mono">{"{sonho}"}</span> para personalizar.
                </p>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <MoonStar className="h-4 w-4 text-primary" /> Não perturbe
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Silêncio total dentro dessa janela — nada aparece nem vibra.
                  </p>
                </div>
                <Switch
                  checked={reminder.quietEnabled}
                  onCheckedChange={(v) => setReminder({ quietEnabled: v })}
                  aria-label="Ativar não perturbe"
                />
              </div>
              {reminder.quietEnabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dnd-from">A partir de</Label>
                    <Input
                      id="dnd-from"
                      type="time"
                      value={reminder.quietFrom}
                      onChange={(e) => setReminder({ quietFrom: e.target.value || "22:00" })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dnd-to">Até</Label>
                    <Input
                      id="dnd-to"
                      type="time"
                      value={reminder.quietTo}
                      onChange={(e) => setReminder({ quietTo: e.target.value || "07:00" })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-dashed border-border p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prévia</p>
              <p className="mt-1 text-sm">{reminderMessage(ctx, voice)}</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  const sent = notificationsSupported() && showReminderNotification(ctx, voice);
                  if (!sent) toast(reminderMessage(ctx, voice));
                }}
              >
                Ver como fica
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
