import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Crown,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { PremiumDialog } from "@/components/premium-dialog";
import { useIsPremium } from "@/components/premium-gate";
import { FREE_LIMITS } from "@/lib/plan";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";
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
import { GOAL_LABELS, TREASURY_GOAL_ID, brl, brlCompact, type GoalKind } from "@/lib/aurin";
import { cn } from "@/lib/utils";
import { currentMonthKey, monthTotals, useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/multiplicador")({
  head: () => ({
    meta: [
      { title: "Moedas do Futuro — Cofres que crescem | AURIN" },
      {
        name: "description",
        content:
          "Crie cofres do tesouro, deposite ouro e simule quanto suas moedas rendem ao longo dos anos.",
      },
      { property: "og:title", content: "Multiplicador de Ouro | AURIN" },
      {
        property: "og:description",
        content: "Cofres, reserva de emergência, ativos fixos e simulador de Moedas do Futuro.",
      },
    ],
  }),
  component: MultiplierPage,
});

const goalSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome").max(60, "Máximo de 60 caracteres"),
  target: z.number().positive("A meta deve ser maior que zero").max(100_000_000),
  balance: z.number().min(0).max(100_000_000),
  kind: z.enum(["reserva", "moradia", "investimento", "aposentadoria", "outro"]),
});

const assetSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome").max(60),
  value: z.number().positive("Valor inválido").max(1_000_000_000),
  monthlyIncome: z.number().min(0).max(10_000_000),
});

function MultiplierPage() {
  const goals = useAurinStore((s) => s.goals);
  const assets = useAurinStore((s) => s.assets);
  const transactions = useAurinStore((s) => s.transactions);
  const addGoal = useAurinStore((s) => s.addGoal);
  const premium = useIsPremium();
  const [salesOpen, setSalesOpen] = useState(false);
  const dreamCount = goals.filter((g) => g.id !== TREASURY_GOAL_ID).length;
  const lockedDreams = !premium && dreamCount >= FREE_LIMITS.dreams;
  const removeGoal = useAurinStore((s) => s.removeGoal);
  const depositToGoal = useAurinStore((s) => s.depositToGoal);
  const updateGoal = useAurinStore((s) => s.updateGoal);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const addAsset = useAurinStore((s) => s.addAsset);
  const removeAsset = useAurinStore((s) => s.removeAsset);

  const [goalOpen, setGoalOpen] = useState(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [assetOpen, setAssetOpen] = useState(false);

  const month = useMemo(() => monthTotals(transactions, currentMonthKey()), [transactions]);
  const reserve = goals.find((g) => g.kind === "reserva");
  const monthsCovered = month.expense > 0 && reserve ? reserve.balance / month.expense : 0;
  const passiveIncome = assets.reduce((s, a) => s + a.monthlyIncome, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Multiplicador de Ouro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          "Faça de cada moeda um trabalhador que gera filhos para você."
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ouro em cofres</p>
            <p className="mt-1 font-display text-xl font-bold text-gold">
              {brl(goals.reduce((s, g) => s + g.balance, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Escudo (meses cobertos)
            </p>
            <p className="mt-1 font-display text-xl font-bold text-success">
              {monthsCovered.toFixed(1)} meses
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/30">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Renda passiva mensal
            </p>
            <p className="mt-1 font-display text-xl font-bold text-accent">{brl(passiveIncome)}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-lg font-bold">Cofres do Tesouro</h2>
          <Button
            size="sm"
            onClick={() => (lockedDreams ? setSalesOpen(true) : setGoalOpen(true))}
            className="shrink-0 bg-gold text-primary-foreground hover:opacity-90"
          >
            {lockedDreams ? <Crown className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Novo
            cofre
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const percent = goal.target > 0 ? (goal.balance / goal.target) * 100 : 0;
            return (
              <Card key={goal.id} className="min-w-0">
                <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <SymbolBadge symbol={goalIcon(goal.icon ?? inferGoalIcon(goal.name))} />
                    <div className="min-w-0">
                    <CardTitle className="truncate text-base">{goal.name}</CardTitle>
                    <Badge variant="outline" className="mt-2 border-primary/40 text-primary">
                      {GOAL_LABELS[goal.kind]}
                    </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Ajustar ${goal.name}`}
                      onClick={() => setEditGoalId(goal.id)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  {goal.id !== TREASURY_GOAL_ID && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remover cofre"
                      onClick={() => {
                        removeGoal(goal.id);
                        toast.success("Cofre removido");
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-xl font-bold text-gold">{brl(goal.balance)}</p>
                  <p className="text-xs text-muted-foreground">meta de {brl(goal.target)}</p>
                  <Progress value={Math.min(100, percent)} className="mt-3 h-2" />
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate text-xs text-muted-foreground">
                      {percent.toFixed(0)}% conquistado
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => setDepositId(goal.id)}>
                      <Sparkles className="h-3.5 w-3.5" /> Depositar Ouro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <CompoundSimulator />

      <section>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-lg font-bold">Habitação e Renda Futura</h2>
          <Button size="sm" variant="secondary" onClick={() => setAssetOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" /> Novo ativo
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <Card key={asset.id} className="min-w-0">
              <CardContent className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pt-6">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{asset.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {brl(asset.value)} · gera {brl(asset.monthlyIncome)}/mês
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remover ativo"
                  onClick={() => removeAsset(asset.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {assets.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum ativo registrado. "Possua a própria casa" é a quinta cura de Arkad.
            </p>
          )}
        </div>
        <Card className="mt-4 border-success/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-sm text-muted-foreground">
              Com {brl(passiveIncome)} de renda passiva por mês, seus ativos já cobrem{" "}
              <span className="font-semibold text-foreground">
                {month.expense > 0 ? ((passiveIncome / month.expense) * 100).toFixed(0) : 0}%
              </span>{" "}
              das suas despesas mensais.
            </p>
          </CardContent>
        </Card>
      </section>

      <GoalDialog open={goalOpen} onOpenChange={setGoalOpen} onSubmit={addGoal} />
      <PremiumDialog
        open={salesOpen}
        onOpenChange={setSalesOpen}
        highlight="Cofres de sonho ilimitados"
      />
      <EditGoalDialog
        goalId={editGoalId}
        onClose={() => setEditGoalId(null)}
        onSave={updateGoal}
      />
      <DepositDialog
        goalId={depositId}
        onClose={() => setDepositId(null)}
        onDeposit={depositToGoal}
      />
      <AssetDialog open={assetOpen} onOpenChange={setAssetOpen} onSubmit={addAsset} />
    </div>
  );
}

function CompoundSimulator() {
  const [initial, setInitial] = useState(5000);
  const [monthly, setMonthly] = useState(800);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(20);

  const data = useMemo(() => {
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
    let balance = initial;
    let contributed = initial;
    const rows = [{ ano: 0, total: balance, aportes: contributed, juros: 0 }];
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthly;
        contributed += monthly;
      }
      rows.push({
        ano: y,
        total: Math.round(balance),
        aportes: Math.round(contributed),
        juros: Math.round(balance - contributed),
      });
    }
    return rows;
  }, [initial, monthly, rate, years]);

  const last = data[data.length - 1];

  const checkpoints = useMemo(() => {
    const marks = [1, 2, 3, 4]
      .map((n) => Math.max(1, Math.round((years * n) / 4)))
      .filter((v, i, arr) => arr.indexOf(v) === i);
    const max = last.total || 1;
    return marks.map((ano) => {
      const row = data[Math.min(ano, data.length - 1)];
      return {
        ano,
        total: row.total,
        fill: Math.max(8, (row.total / max) * 100),
        freedom: row.total / (monthly > 0 ? monthly * 4 : 3000),
      };
    });
  }, [data, years, last.total, monthly]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Ouro que Gera Filhos — Moedas do Futuro
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <SliderField
            label="Aporte inicial"
            value={initial}
            display={brl(initial)}
            min={0}
            max={100000}
            step={500}
            onChange={setInitial}
          />
          <SliderField
            label="Aporte mensal"
            value={monthly}
            display={brl(monthly)}
            min={0}
            max={10000}
            step={50}
            onChange={setMonthly}
          />
          <SliderField
            label="Taxa anual"
            value={rate}
            display={`${rate}% a.a.`}
            min={1}
            max={25}
            step={0.5}
            onChange={setRate}
          />
          <SliderField
            label="Prazo"
            value={years}
            display={`${years} anos`}
            min={1}
            max={40}
            step={1}
            onChange={setYears}
          />

          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tesouro em {years} anos
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-gold">{brl(last.total)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Aportes: {brl(last.aportes)} · Moedas do Futuro:{" "}
              <span className="font-semibold text-success">{brl(last.juros)}</span>
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Seus vasos de ouro ao longo do tempo
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {checkpoints.map((c, i) => (
              <div
                key={c.ano}
                className="reveal-step rounded-xl border border-border bg-secondary/40 p-3 text-center"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <p className="text-xs font-semibold text-muted-foreground">Ano {c.ano}</p>
                <div className="relative mx-auto mt-2 h-24 w-14 overflow-hidden rounded-b-[1.6rem] rounded-t-lg border-2 border-border">
                  <span
                    className="vault-fill absolute inset-x-0 bottom-0 bg-gold"
                    style={
                      {
                        height: `${c.fill}%`,
                        "--fill-from": "0%",
                        "--fill-to": `${c.fill}%`,
                        animationDelay: `${i * 0.08}s`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <p className="mt-2 font-display text-sm font-bold text-gold">
                  {brlCompact(c.total)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {c.freedom.toFixed(0)} meses livres
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
            <span className="font-semibold text-accent">Moedas do Futuro trabalhando por você:</span>{" "}
            {last.aportes > 0
              ? `cada R$ 1 aportado virou R$ ${(last.total / last.aportes).toFixed(2)}.`
              : "aumente seus aportes para ver o efeito."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SliderField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Label className="truncate">{label}</Label>
        <span className="shrink-0 text-sm font-semibold text-primary">{display}</span>
      </div>
      <Slider
        className="mt-2"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      />
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (goal: { name: string; target: number; balance: number; kind: GoalKind }) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [balance, setBalance] = useState(0);
  const [kind, setKind] = useState<GoalKind>("investimento");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const parsed = goalSchema.safeParse({
      name,
      target,
      balance,
      kind,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    onSubmit({ ...parsed.data, icon: icon || inferGoalIcon(parsed.data.name) });
    toast.success("Cofre criado");
    setName("");
    setIcon("");
    setTarget(0);
    setBalance(0);
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Novo Cofre do Tesouro</DialogTitle>
          <DialogDescription>Defina um destino claro para o seu ouro.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="goal-name">Nome</Label>
            <Input
              id="goal-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Liberdade Financeira"
            />
          </div>
          <div className="grid gap-2">
            <Label>Figurinha do sonho</Label>
            <SymbolPicker
              options={GOAL_ICONS}
              value={icon || inferGoalIcon(name)}
              onChange={setIcon}
              ariaLabel="Figurinha do sonho"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="goal-target">Meta</Label>
              <CurrencyInput id="goal-target" value={target} onValueChange={setTarget} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-balance">Saldo atual</Label>
              <CurrencyInput id="goal-balance" value={balance} onValueChange={setBalance} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as GoalKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-gold text-primary-foreground hover:opacity-90">
            Criar cofre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGoalDialog({
  goalId,
  onClose,
  onSave,
}: {
  goalId: string | null;
  onClose: () => void;
  onSave: (id: string, patch: { name?: string; target?: number; icon?: string }) => void;
}) {
  const goal = useAurinStore((s) => s.goals.find((g) => g.id === goalId));
  const [name, setName] = useState("");
  const [target, setTarget] = useState(0);
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(goal.target);
      setIcon(goal.icon ?? inferGoalIcon(goal.name));
    }
  }, [goal?.id]);

  return (
    <Dialog open={Boolean(goalId)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Ajustar cofre</DialogTitle>
          <DialogDescription>Seu sonho pode mudar de tamanho. Tudo bem.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="eg-name">Nome</Label>
            <Input
              id="eg-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eg-target">Meta</Label>
            <CurrencyInput id="eg-target" value={target} onValueChange={setTarget} />
          </div>
          <div className="grid gap-2">
            <Label>Figurinha do sonho</Label>
            <SymbolPicker
              options={GOAL_ICONS}
              value={icon || inferGoalIcon(name)}
              onChange={setIcon}
              ariaLabel="Figurinha do sonho"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-gold text-primary-foreground hover:opacity-90"
            disabled={!name.trim()}
            onClick={() => {
              if (!goalId) return;
              onSave(goalId, { name: name.trim(), target, icon: icon || inferGoalIcon(name) });
              toast.success("Cofre atualizado");
              onClose();
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DepositDialog({
  goalId,
  onClose,
  onDeposit,
}: {
  goalId: string | null;
  onClose: () => void;
  onDeposit: (id: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState("");
  const goal = useAurinStore((s) => s.goals.find((g) => g.id === goalId));
  const withdrawFromGoal = useAurinStore((s) => s.withdrawFromGoal);

  function submit() {
    const value = amount;
    if (!Number.isFinite(value) || value <= 0 || value > 100_000_000) {
      setError("Informe um valor válido");
      return;
    }
    if (goalId) onDeposit(goalId, value);
    toast.success(`${brl(value)} depositados no cofre`);
    setAmount(0);
    setError("");
    onClose();
  }

  return (
    <Dialog open={Boolean(goalId)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Depositar Ouro</DialogTitle>
          <DialogDescription className="truncate">{goal?.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="deposit-amount">Valor</Label>
          <CurrencyInput id="deposit-amount" value={amount} onValueChange={setAmount} autoFocus />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={amount <= 0}
            onClick={() => {
              if (!goalId) return;
              withdrawFromGoal(goalId, amount);
              toast.success(`${brl(amount)} retirados. Sem culpa: o dinheiro é seu.`);
              setAmount(0);
              onClose();
            }}
          >
            Retirar
          </Button>
          <Button onClick={submit} className="bg-gold text-primary-foreground hover:opacity-90">
            Depositar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssetDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (asset: { name: string; value: number; monthlyIncome: number }) => void;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [income, setIncome] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const parsed = assetSchema.safeParse({
      name,
      value: Number(value.replace(",", ".")),
      monthlyIncome: Number(income.replace(",", ".") || 0),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    onSubmit(parsed.data);
    toast.success("Ativo registrado");
    setName("");
    setValue("");
    setIncome("");
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="font-display">Novo ativo fixo</DialogTitle>
          <DialogDescription>Imóveis e fontes de renda passiva.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="asset-name">Nome</Label>
            <Input
              id="asset-name"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Apartamento alugado"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="asset-value">Valor (R$)</Label>
              <Input
                id="asset-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asset-income">Renda mensal (R$)</Label>
              <Input
                id="asset-income"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
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
