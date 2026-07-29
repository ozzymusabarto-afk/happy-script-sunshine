import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChainProgress } from "@/components/journey-visuals";
import { Crown, HandCoins, Pencil, Plus, Quote, Trash2 } from "lucide-react";
import { PremiumDialog } from "@/components/premium-dialog";
import { useIsPremium } from "@/components/premium-gate";
import { FREE_LIMITS } from "@/lib/plan";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAurinHydrated } from "@/hooks/use-aurin-hydrated";
import { DEBT_LABELS, brl, brlCompact, type Debt, type DebtType } from "@/lib/aurin";
import { rescueEncouragement } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { debtSummary, simulatePayoff, useAurinStore, type Strategy } from "@/store/aurin-store";

export const Route = createFileRoute("/libertacao")({
  head: () => ({
    meta: [
      { title: "Plano de Libertação | AURIN" },
      {
        name: "description",
        content: "Veja quanto da sua paz já foi reconquistada e a data em que você fica livre.",
      },
      { property: "og:title", content: "Plano de Libertação | AURIN" },
      {
        property: "og:description",
        content: "Cada pagamento solta uma corrente e antecipa a sua paz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DebtsPage,
});

function DebtsPage() {
  const hydrated = useAurinHydrated();
  const debts = useAurinStore((s) => s.debts);
  const profileName = useAurinStore((s) => s.profile.name);
  const payDebt = useAurinStore((s) => s.payDebt);
  const removeDebt = useAurinStore((s) => s.removeDebt);
  const premium = useIsPremium();
  const [salesOpen, setSalesOpen] = useState(false);
  const activeRescues = debts.filter((d) => d.principal - d.paid > 0).length;
  const lockedRescues = !premium && activeRescues >= FREE_LIMITS.rescues;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [budget, setBudget] = useState(1200);

  const summary = useMemo(() => debtSummary(debts), [debts]);
  const avalanche = useMemo(() => simulatePayoff(debts, budget, "avalanche"), [debts, budget]);
  const snowball = useMemo(() => simulatePayoff(debts, budget, "snowball"), [debts, budget]);
  const chosen = strategy === "avalanche" ? avalanche : snowball;

  const milestones = useMemo(() => {
    const series = chosen.series ?? [];
    if (series.length === 0) return [];
    const start = series[0]?.saldo ?? 0;
    const picks = [0, 0.25, 0.5, 0.75, 1].map((f) =>
      Math.min(series.length - 1, Math.round(f * (series.length - 1))),
    );
    return picks
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .map((i) => {
        const row = series[i];
        return {
          month: row.month,
          saldo: row.saldo,
          freed: start > 0 ? ((start - row.saldo) / start) * 100 : 100,
        };
      });
  }, [chosen]);

  const peaceMonths = useMemo(() => {
    const worst = Math.max(avalanche.months, snowball.months);
    return Math.max(0, worst - chosen.months);
  }, [avalanche.months, snowball.months, chosen.months]);

  const freedomDate = useMemo(() => {
    if (chosen.months <= 0) return "Você já está livre";
    const d = new Date();
    d.setMonth(d.getMonth() + chosen.months);
    return `Livre em ${d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
  }, [chosen.months]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Plano de Libertação</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rescueEncouragement({
              progress: summary.progress,
              months: chosen.months,
              name: profileName,
              seed: ((summary.progress | 0) % 7) / 7,
            })}
          </p>
        </div>
        <Button
          className="shrink-0 bg-gold text-primary-foreground hover:opacity-90"
          onClick={() => {
            if (lockedRescues) {
              setSalesOpen(true);
              return;
            }
            setEditing(null);
            setOpen(true);
          }}
        >
          {lockedRescues ? <Crown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">Novo resgate</span>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Já libertado" value={brl(summary.paid)} tone="success" />
        <Stat label="Quanto falta para a paz" value={brl(summary.remaining)} />
        <Stat
          label="Peso de esperar mais um mês"
          value={brl((summary.remaining * summary.weightedRate) / 100)}
        />
        <Stat
          label="Sua liberdade chega em"
          value={
            summary.monthsToFreedom > 0 ? `${summary.monthsToFreedom} meses` : "Você já é livre"
          }
          tone="success"
        />
      </div>

      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Quanto do seu futuro já está livre</span>
            <span className="font-semibold text-success">{summary.progress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(100, summary.progress)} className="mt-2 h-3" />
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Cada real do pilar de 20% empurra esta barra — e a sua tranquilidade — para frente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-4 w-4 text-primary" />
            Seus resgates de paz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {debts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum peso preso a você hoje. Aproveite essa leveza.
            </p>
          )}
          {debts.map((debt) => {
            const remaining = Math.max(0, debt.principal - debt.paid);
            const percent = debt.principal > 0 ? (debt.paid / debt.principal) * 100 : 100;
            const installment = debt.installments > 0 ? debt.principal / debt.installments : 0;
            return (
              <div key={debt.id} className="min-w-0 rounded-xl border border-border p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DEBT_LABELS[debt.type]} · {debt.interestRate.toFixed(2)}% a.m. ·{" "}
                      {debt.installments}x de {brl(installment)} · vence dia {debt.dueDay}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "font-display text-lg font-bold",
                        remaining > 0 ? "text-gold" : "text-success",
                      )}
                    >
                      {remaining > 0 ? `${percent.toFixed(0)}% livre` : "Corrente rompida"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {remaining > 0
                        ? `${brl(debt.paid)} já libertados · faltam ${brl(remaining)}`
                        : `${brl(debt.principal)} conquistados`}
                    </p>
                  </div>
                </div>

                <Progress value={Math.min(100, percent)} className="mt-3 h-2" />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remaining <= 0}
                    onClick={() => setPayTarget(debt)}
                  >
                    Soltar mais um pedaço
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Editar ${debt.name}`}
                    onClick={() => {
                      setEditing(debt);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remover ${debt.name}`}
                    onClick={() => {
                      removeDebt(debt.id);
                      toast.success("Resgate removido do seu plano");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quando a paz chega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avalanche">Mais econômico</TabsTrigger>
              <TabsTrigger value="snowball">Vitórias rápidas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Quanto posso dedicar por mês</span>
              <span className="font-semibold text-gold">{brl(budget)}</span>
            </div>
            <Slider
              value={[budget]}
              min={100}
              max={6000}
              step={50}
              className="mt-3"
              onValueChange={([v]) => setBudget(v)}
              aria-label="Valor mensal dedicado à sua paz"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Liberdade em"
              value={chosen.months > 0 ? `${chosen.months} meses` : "Agora"}
              tone="success"
            />
            <Stat
              label="Meses de paz antecipados"
              value={
                peaceMonths > 0
                  ? `${peaceMonths} mês${peaceMonths === 1 ? "" : "es"}`
                  : "Mesmo ritmo"
              }
            />
            <Stat
              label="Caminho mais leve"
              value={avalanche.interest <= snowball.interest ? "Avalanche" : "Bola de neve"}
              tone="success"
            />
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="text-sm font-semibold">Correntes se rompendo</p>
              <span className="font-display text-sm font-bold text-gold">{freedomDate}</span>
            </div>
            <div className="mt-4 space-y-4">
              {milestones.map((m, i) => (
                <div
                  key={m.month}
                  className="reveal-step"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {m.month === 0 ? "Hoje" : `Mês ${m.month}`}
                      {m.month > 0 && m.saldo <= 0 ? " — livre!" : ""}
                    </span>
                    <span className="font-semibold text-foreground">{brlCompact(m.saldo)}</span>
                  </div>
                  <ChainProgress percent={m.freed} className="mt-1.5" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Cada elo dourado é um pedaço da sua liberdade reconquistada.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Avalanche cuida primeiro da corrente mais cara. Bola de neve solta a menor primeiro e
            traz alívio mais cedo. Os dois levam à mesma liberdade — escolha o que te mantém em
            movimento.
          </p>
        </CardContent>
      </Card>

      <DebtDialog open={open} onOpenChange={setOpen} />
      <PremiumDialog
        open={salesOpen}
        onOpenChange={setSalesOpen}
        highlight="Vários Resgates de Paz ao mesmo tempo"
      />

      <PaymentDialog
        debt={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={(amount) => {
          if (payTarget) {
            payDebt(payTarget.id, amount);
            toast.success("Mais um pedaço da sua liberdade conquistado");
          }
          setPayTarget(null);
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 font-display text-xl font-extrabold",
            tone === "success"
              ? "text-success"
              : tone === "destructive"
                ? "text-destructive"
                : "text-gold",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DebtDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Debt | null;
}) {
  const addDebt = useAurinStore((s) => s.addDebt);
  const updateDebt = useAurinStore((s) => s.updateDebt);
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("emprestimo");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("2");
  const [installments, setInstallments] = useState("12");
  const [dueDay, setDueDay] = useState("10");
  const [error, setError] = useState("");

  // Preenche o formulário ao abrir para editar; limpa ao abrir para criar.
  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setName(editing.name);
      setType(editing.type);
      setPrincipal(String(editing.principal).replace(".", ","));
      setRate(String(editing.interestRate).replace(".", ","));
      setInstallments(String(editing.installments));
      setDueDay(String(editing.dueDay));
    } else {
      setName("");
      setType("emprestimo");
      setPrincipal("");
      setRate("2");
      setInstallments("12");
      setDueDay("10");
    }
  }, [open, editing]);

  function submit() {
    const value = Number(principal.replace(",", "."));
    if (name.trim().length < 2) return setError("Informe o nome do compromisso");
    if (!Number.isFinite(value) || value <= 0) return setError("Informe um valor válido");
    if (editing && value < editing.paid) {
      return setError(`O valor não pode ser menor que ${brl(editing.paid)} já libertados`);
    }
    const payload = {
      name: name.trim(),
      type,
      principal: value,
      interestRate: Number(rate.replace(",", ".")) || 0,
      installments: Math.max(1, Number(installments) || 1),
      dueDay: Math.min(28, Math.max(1, Number(dueDay) || 1)),
    };
    if (editing) {
      updateDebt(editing.id, payload);
      toast.success("Resgate de Paz atualizado");
    } else {
      addDebt(payload);
      toast.success("Resgate de Paz criado");
    }
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar resgate" : "Novo resgate"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste os detalhes deste compromisso. O que você já libertou continua guardado."
              : "Registre o valor, o custo mensal e o prazo para ver sua liberdade chegar."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="debt-name">Nome</Label>
            <Input
              id="debt-name"
              value={name}
              maxLength={50}
              placeholder="Ex.: Empréstimo pessoal"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEBT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-principal">Valor total (R$)</Label>
              <Input
                id="debt-principal"
                inputMode="decimal"
                value={principal}
                placeholder="0,00"
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="debt-rate">Custo mensal (%)</Label>
              <Input
                id="debt-rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-inst">Parcelas</Label>
              <Input
                id="debt-inst"
                inputMode="numeric"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="debt-due">Dia do vencimento</Label>
              <Input
                id="debt-due"
                inputMode="numeric"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-gold text-primary-foreground hover:opacity-90">
            {editing ? "Salvar alterações" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  debt,
  onClose,
  onConfirm,
}: {
  debt: Debt | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const remaining = debt ? Math.max(0, debt.principal - debt.paid) : 0;
  const value = Number(amount.replace(",", "."));

  return (
    <Dialog open={Boolean(debt)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar pagamento</DialogTitle>
          <DialogDescription>
            {debt?.name} — ainda falta libertar {brl(remaining)}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="pay-amount">Valor pago (R$)</Label>
          <Input
            id="pay-amount"
            inputMode="decimal"
            value={amount}
            placeholder="0,00"
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Cria uma saída na categoria Resgate de Paz (pilar de 20%).
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!Number.isFinite(value) || value <= 0}
            onClick={() => {
              onConfirm(value);
              setAmount("");
            }}
            className="bg-gold text-primary-foreground hover:opacity-90"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
