import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HandCoins, Plus, Quote, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { debtSummary, simulatePayoff, useAurinStore, type Strategy } from "@/store/aurin-store";

export const Route = createFileRoute("/dividas")({
  head: () => ({
    meta: [
      { title: "Gestão e Quitação de Dívidas | AURIN" },
      {
        name: "description",
        content:
          "Organize suas dívidas, registre pagamentos e compare as estratégias avalanche e bola de neve até a liberdade financeira.",
      },
      { property: "og:title", content: "Gestão e Quitação de Dívidas | AURIN" },
      {
        property: "og:description",
        content: "Simulador de quitação com juros, prazo e evolução do saldo devedor.",
      },
    ],
  }),
  component: DebtsPage,
});

function DebtsPage() {
  const hydrated = useAurinHydrated();
  const debts = useAurinStore((s) => s.debts);
  const payDebt = useAurinStore((s) => s.payDebt);
  const removeDebt = useAurinStore((s) => s.removeDebt);

  const [open, setOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [budget, setBudget] = useState(1200);

  const summary = useMemo(() => debtSummary(debts), [debts]);
  const avalanche = useMemo(() => simulatePayoff(debts, budget, "avalanche"), [debts, budget]);
  const snowball = useMemo(() => simulatePayoff(debts, budget, "snowball"), [debts, budget]);
  const chosen = strategy === "avalanche" ? avalanche : snowball;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
            Gestão e Quitação de Dívidas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            "Pague suas dívidas com determinação crescente." Cada credor quitado é uma corrente a
            menos no seu futuro.
          </p>
        </div>
        <Button
          className="shrink-0 bg-gold text-primary-foreground hover:opacity-90"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova dívida</span>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Saldo devedor" value={brl(summary.remaining)} tone="destructive" />
        <Stat label="Já quitado" value={brl(summary.paid)} tone="success" />
        <Stat label="Juro médio" value={`${summary.weightedRate.toFixed(2)}% a.m.`} />
        <Stat
          label="Meses para a liberdade"
          value={summary.monthsToFreedom > 0 ? `${summary.monthsToFreedom} meses` : "Livre"}
        />
      </div>

      <Card className="border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Progresso geral de quitação</span>
            <span className="font-semibold text-success">{summary.progress.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(100, summary.progress)} className="mt-2 h-3" />
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Destine o pilar de 20% (Reservas & Dívidas) para acelerar esta barra.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-4 w-4 text-primary" />
            Suas dívidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {debts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma dívida registrada. Que Arkad mantenha assim.
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
                        remaining > 0 ? "text-destructive" : "text-success",
                      )}
                    >
                      {remaining > 0 ? brl(remaining) : "Quitada"}
                    </p>
                    <p className="text-xs text-muted-foreground">de {brl(debt.principal)}</p>
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
                    Registrar pagamento
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Remover ${debt.name}`}
                    onClick={() => {
                      removeDebt(debt.id);
                      toast.success("Dívida removida");
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
          <CardTitle className="text-base">Simulador de quitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avalanche">Avalanche (maior juro)</TabsTrigger>
              <TabsTrigger value="snowball">Bola de neve (menor saldo)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Valor mensal disponível</span>
              <span className="font-semibold text-gold">{brl(budget)}</span>
            </div>
            <Slider
              value={[budget]}
              min={100}
              max={6000}
              step={50}
              className="mt-3"
              onValueChange={([v]) => setBudget(v)}
              aria-label="Valor mensal destinado às dívidas"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Prazo estimado"
              value={chosen.months > 0 ? `${chosen.months} meses` : "—"}
            />
            <Stat label="Juros pagos" value={brl(chosen.interest)} tone="destructive" />
            <Stat
              label="Melhor estratégia"
              value={avalanche.interest <= snowball.interest ? "Avalanche" : "Bola de neve"}
              tone="success"
            />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chosen.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="debtFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tickFormatter={(v) => brlCompact(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  formatter={(v: number) => brl(Number(v))}
                  labelFormatter={(l) => `Mês ${l}`}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="var(--destructive)"
                  fill="url(#debtFill)"
                  strokeWidth={2}
                  name="Saldo devedor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground">
            Avalanche ataca a dívida de maior juro (economiza mais dinheiro). Bola de neve elimina a
            menor primeiro (gera motivação mais rápido).
          </p>
        </CardContent>
      </Card>

      <DebtDialog open={open} onOpenChange={setOpen} />
      <PaymentDialog
        debt={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={(amount) => {
          if (payTarget) {
            payDebt(payTarget.id, amount);
            toast.success("Pagamento registrado");
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

function DebtDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addDebt = useAurinStore((s) => s.addDebt);
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("emprestimo");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("2");
  const [installments, setInstallments] = useState("12");
  const [dueDay, setDueDay] = useState("10");
  const [error, setError] = useState("");

  function submit() {
    const value = Number(principal.replace(",", "."));
    if (name.trim().length < 2) return setError("Informe o nome da dívida");
    if (!Number.isFinite(value) || value <= 0) return setError("Informe um valor válido");
    addDebt({
      name: name.trim(),
      type,
      principal: value,
      interestRate: Number(rate.replace(",", ".")) || 0,
      installments: Math.max(1, Number(installments) || 1),
      dueDay: Math.min(28, Math.max(1, Number(dueDay) || 1)),
    });
    toast.success("Dívida registrada");
    setName("");
    setPrincipal("");
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Nova dívida</DialogTitle>
          <DialogDescription>
            Registre o valor original, os juros e o prazo para simular a quitação.
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
              <Label htmlFor="debt-rate">Juros (% a.m.)</Label>
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
            Registrar
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
            {debt?.name} — saldo devedor de {brl(remaining)}.
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
            Cria uma saída na categoria Dívidas (pilar de 20%).
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
