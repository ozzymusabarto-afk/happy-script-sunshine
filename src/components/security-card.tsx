import { useEffect, useState } from "react";
import { BellRing, Fingerprint, Lock, ShieldCheck } from "lucide-react";
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
import {
  askNotificationPermission,
  morningMessage,
  notificationPermission,
  notificationsSupported,
  showMorningNotification,
} from "@/lib/notifications";
import { biometricsSupported, hashPin, newSalt, registerBiometrics } from "@/lib/security";
import { useAurinStore } from "@/store/aurin-store";

export function SecurityCard() {
  const security = useAurinStore((s) => s.security);
  const setSecurity = useAurinStore((s) => s.setSecurity);
  const disableLock = useAurinStore((s) => s.disableLock);
  const name = useAurinStore((s) => s.profile.name);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [canBio, setCanBio] = useState(false);
  const [busy, setBusy] = useState(false);

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
                  <SelectItem value="0">Sempre que eu abrir</SelectItem>
                  <SelectItem value="1">Depois de 1 minuto fora</SelectItem>
                  <SelectItem value="5">Depois de 5 minutos fora</SelectItem>
                  <SelectItem value="30">Depois de 30 minutos fora</SelectItem>
                </SelectContent>
              </Select>
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

  return (
    <Card className="reveal-step">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-primary" /> Meu chamado da manhã
        </CardTitle>
        <CardDescription>
          Um lembrete gentil por dia, só sobre o seu progresso — nunca cobrança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">Receber o chamado</p>
            <p className="text-xs text-muted-foreground">
              {permission === "denied"
                ? "As notificações estão bloqueadas nas configurações do navegador."
                : "Aparece uma vez por dia, no horário que você escolher."}
            </p>
          </div>
          <Switch
            checked={reminder.enabled}
            onCheckedChange={(v) => void toggle(v)}
            aria-label="Ativar chamado da manhã"
          />
        </div>

        {reminder.enabled && (
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
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const ctx = {
                    name: profile.name,
                    dreamName: profile.dreamName,
                    dreamProgress: 0,
                  };
                  const sent = notificationsSupported() && showMorningNotification(ctx);
                  if (!sent) toast(morningMessage(ctx));
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
