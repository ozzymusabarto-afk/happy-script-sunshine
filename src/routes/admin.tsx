import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAdminMetrics,
  getIsAdmin,
  listPremiumStatus,
  setPremiumForEmail,
  type AdminMetrics,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sala do Guardião | AURIN" },
      {
        name: "description",
        content:
          "Área restrita do AURIN para liberar ou revogar assinaturas Premium e acompanhar o estado das contas.",
      },
      { property: "og:title", content: "Sala do Guardião | AURIN" },
      {
        property: "og:description",
        content: "Área restrita de administração do AURIN.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  email: string;
  plan: string | null;
  active: boolean;
  approved_at: string | null;
  expires_at: string | null;
  updated_at: string;
};

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-gold">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(getIsAdmin);
  const listRows = useServerFn(listPremiumStatus);
  const savePremium = useServerFn(setPremiumForEmail);
  const loadMetrics = useServerFn(getAdminMetrics);

  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [result, metricsResult] = await Promise.all([listRows(), loadMetrics()]);
      setRows(result.rows as Row[]);
      setMetrics(metricsResult.metrics);
    } catch {
      toast.error("Não consegui carregar as assinaturas agora.");
    }
  }, [listRows, loadMetrics]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const result = await checkAdmin();
        if (!alive) return;
        if (!result.admin) {
          setState("denied");
          return;
        }
        setState("ok");
        await refresh();
      } catch {
        if (alive) setState("denied");
      }
    })();
    return () => {
      alive = false;
    };
  }, [checkAdmin, refresh]);

  const apply = async (active: boolean, plan: "monthly" | "yearly" = "monthly") => {
    if (!email.trim()) {
      toast.error("Escreva um e-mail primeiro.");
      return;
    }
    setBusy(true);
    try {
      await savePremium({ data: { email, active, plan } });
      toast.success(active ? "Premium liberado." : "Premium revogado.");
      setEmail("");
      await refresh();
    } catch {
      toast.error("Não consegui salvar. Confira o e-mail e tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

  if (state === "loading") {
    return <p className="text-sm text-muted-foreground">Conferindo suas permissões…</p>;
  }

  if (state === "denied") {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" /> Esta porta não é para você
          </CardTitle>
          <CardDescription>
            Se você é o guardião do AURIN, entre com a conta autorizada e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => void navigate({ to: "/conta" })}>Ir para minha conta</Button>
          <Button variant="ghost" onClick={() => void navigate({ to: "/" })}>
            Voltar ao Templo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="reveal-step">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Área restrita</p>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Sala do Guardião</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui você libera ou revoga o Premium manualmente e acompanha as assinaturas reconhecidas
          pela Hotmart.
        </p>
      </header>

      {metrics && (
        <section className="reveal-step space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Contas criadas"
              value={metrics.accounts}
              hint={`+${metrics.accounts_new_7d} em 7 dias`}
            />
            <Stat
              label="Premium ativos"
              value={metrics.premium_active}
              hint={`${metrics.premium_monthly} mensal · ${metrics.premium_yearly} anual`}
            />
            <Stat
              label="Gratuitas (estimativa)"
              value={Math.max(0, metrics.accounts - metrics.premium_active)}
              hint={`${metrics.premium_inactive} inativas/expiradas`}
            />
            <Stat
              label="Backups na nuvem"
              value={metrics.cloud_backups}
              hint="jornadas sincronizadas"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Aberturas hoje"
              value={metrics.opens_today}
              hint={`${metrics.opens_7d} em 7 dias`}
            />
            <Stat label="Aberturas 30 dias" value={metrics.opens_30d} hint="uso recorrente" />
            <Stat
              label="Viram o Premium"
              value={metrics.premium_views}
              hint={`${metrics.checkout_clicks} foram ao checkout`}
            />
            <Stat
              label="Conversão"
              value={
                metrics.premium_views > 0
                  ? `${Math.round((metrics.activations / metrics.premium_views) * 100)}%`
                  : "—"
              }
              hint={`${metrics.activations} ativações`}
            />
          </div>
        </section>
      )}

      <Card className="reveal-step">
        <CardHeader>
          <CardTitle className="text-base">Liberar ou revogar Premium</CardTitle>
          <CardDescription>
            Use o mesmo e-mail com que a pessoa entra no AURIN. A mudança vale na próxima abertura
            do app dela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="email"
            inputMode="email"
            placeholder="pessoa@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() => void apply(true, "monthly")}
              className="bg-gold text-primary-foreground hover:opacity-90"
            >
              <ShieldCheck className="h-4 w-4" /> Liberar mensal
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void apply(true, "yearly")}>
              <ShieldCheck className="h-4 w-4" /> Liberar anual
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={() => void apply(false)}
            >
              <ShieldOff className="h-4 w-4" /> Revogar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="reveal-step">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Assinaturas ({rows.length})</CardTitle>
            <CardDescription>Últimas 100 movimentações registradas.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma assinatura registrada ainda.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.email}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.plan === "yearly" ? "Anual" : "Mensal"} · atualizado em{" "}
                    {fmt(row.updated_at)}
                  </p>
                </div>
                <span
                  className={
                    row.active
                      ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
                      : "rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                  }
                >
                  {row.active ? "Ativo" : "Inativo"}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
