import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { CloudDownload, CloudUpload, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta na nuvem | AURIN" },
      {
        name: "description",
        content:
          "Entre com o Google e mantenha sua jornada do Resgate de Paz sincronizada entre aparelhos, sem perder nada ao trocar de celular.",
      },
      { property: "og:title", content: "Minha conta na nuvem | AURIN" },
      {
        property: "og:description",
        content: "Sincronize sua jornada financeira com segurança entre seus aparelhos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

/** Só os dados da jornada — a proteção deste aparelho (PIN) nunca sobe. */
function snapshot() {
  const state = useAurinStore.getState();
  const { celebration: _c, security: _s, ...rest } = state;
  return JSON.parse(
    JSON.stringify(
      Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")),
    ),
  ) as Record<string, unknown>;
}

function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [remoteAt, setRemoteAt] = useState<string | null>(null);
  const [guardian, setGuardian] = useState(false);
  const importState = useAurinStore((s) => s.importState);
  const markBackup = useAurinStore((s) => s.markBackup);
  const lastBackupAt = useAurinStore((s) => s.lastBackupAt);
  const readStatus = useServerFn(getPremiumStatus);

  const refreshRemote = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("aurin_backups")
      .select("updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    setRemoteAt(data?.updated_at ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) void refreshRemote(s.user.id);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void refreshRemote(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshRemote]);

  // Selo discreto do guardião: o servidor decide, o cliente só exibe.
  useEffect(() => {
    if (!session?.user) {
      setGuardian(false);
      return;
    }
    void readStatus()
      .then((status) => setGuardian(status.plan === "admin"))
      .catch(() => setGuardian(false));
  }, [session, readStatus]);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("Não consegui entrar agora. Tente de novo em instantes.");
      return;
    }
    if (result.redirected) return;
    void logEvent({ data: { event: "signin" } }).catch(() => undefined);
    toast.success("Conta conectada. Sua jornada está protegida.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRemoteAt(null);
    toast.success("Você saiu da conta. Seus dados continuam neste aparelho.");
  };

  const push = async () => {
    if (!session?.user) return;
    setBusy(true);
    const { error } = await supabase.from("aurin_backups").upsert(
      {
        user_id: session.user.id,
        payload: snapshot() as never,
        device_label: navigator.userAgent.slice(0, 120),
      },
      { onConflict: "user_id" },
    );
    setBusy(false);
    if (error) {
      toast.error("Não consegui guardar na nuvem agora.");
      return;
    }
    markBackup();
    await refreshRemote(session.user.id);
    toast.success("Jornada guardada na nuvem.");
  };

  const pull = async () => {
    if (!session?.user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("aurin_backups")
      .select("payload, updated_at")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error("Ainda não há nada guardado na nuvem.");
      return;
    }
    const ok = window.confirm(
      "Trazer os dados da nuvem substitui o que está neste aparelho. Deseja continuar?",
    );
    if (!ok) return;
    importState(data.payload as Record<string, unknown>);
    setRemoteAt(data.updated_at);
    toast.success("Sua jornada foi restaurada neste aparelho.");
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-6">
      <header className="reveal-step">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">
          Sua jornada, sempre com você
        </p>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Minha conta na nuvem</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com o Google para guardar sua jornada em segurança e recuperá-la em qualquer
          aparelho. Nada sobe sem você pedir.
        </p>
      </header>

      <Card className="reveal-step">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Conta conectada
          </CardTitle>
          <CardDescription>
            Seu PIN e sua biometria continuam apenas neste aparelho — eles nunca vão para a nuvem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!session ? (
            <Button
              disabled={busy}
              onClick={() => void signIn()}
              className="bg-gold text-primary-foreground hover:opacity-90"
            >
              Entrar com Google
            </Button>
          ) : (
            <>
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{session.user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Última cópia na nuvem: {fmt(remoteAt)} · Último backup local: {fmt(lastBackupAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  onClick={() => void push()}
                  className="bg-gold text-primary-foreground hover:opacity-90"
                >
                  <CloudUpload className="h-4 w-4" /> Guardar na nuvem
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => void pull()}>
                  <CloudDownload className="h-4 w-4" /> Trazer da nuvem
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void refreshRemote(session.user.id)}
                >
                  <RefreshCw className="h-4 w-4" /> Atualizar status
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => void signOut()}
                >
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
