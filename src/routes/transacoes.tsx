import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Pencil, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { TransactionDialog } from "@/components/transaction-dialog";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_LABELS,
  brl,
  formatDate,
  type Transaction,
} from "@/lib/aurin";
import { cn } from "@/lib/utils";
import { useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/transacoes")({
  head: () => ({
    meta: [
      { title: "Registro das Moedas — AURIN" },
      {
        name: "description",
        content: "Registre, filtre e organize cada entrada e saída de ouro do seu tesouro.",
      },
      { property: "og:title", content: "Registro das Moedas — AURIN" },
      {
        property: "og:description",
        content: "Histórico completo de transações com filtros por categoria, tipo e pagamento.",
      },
    ],
  }),
  component: TransactionsPage,
});

const ALL = "todos";

function TransactionsPage() {
  const transactions = useAurinStore((s) => s.transactions);
  const removeTransaction = useAurinStore((s) => s.removeTransaction);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [method, setMethod] = useState<string>(ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .filter((t) => {
        if (type !== ALL && t.type !== type) return false;
        if (category !== ALL && t.category !== category) return false;
        if (method !== ALL && t.method !== method) return false;
        if (q && !`${t.title} ${t.category}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, query, type, category, method]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === "entrada") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Registro das Moedas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada moeda anotada é uma moeda sob controle. {filtered.length} registro(s) encontrados.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              maxLength={60}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou categoria"
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os tipos</SelectItem>
              <SelectItem value="entrada">Ouro Entrada</SelectItem>
              <SelectItem value="saida">Ouro Saída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]
                .filter((c, i, arr) => arr.indexOf(c) === i)
                .map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os pagamentos</SelectItem>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-success/30">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Entradas filtradas
            </p>
            <p className="mt-1 font-display text-xl font-bold text-success">{brl(totals.income)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Saídas filtradas
            </p>
            <p className="mt-1 font-display text-xl font-bold text-destructive">
              {brl(totals.expense)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 &&
            (transactions.length === 0 ? (
              <EmptyState
                className="border-0 bg-transparent"
                icon={<Sparkles className="h-6 w-6" />}
                title="Sua história começa aqui"
                description="Registre a primeira entrada ou despesa real. Não precisa ser perfeito — precisa ser verdadeiro."
                actionLabel="Registrar minha primeira moeda"
                hint="Uma parte de tudo que ganho é minha para guardar."
                onAction={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma moeda encontrada com esses filtros.
              </p>
            ))}
          {filtered.map((t) => (
            <div
              key={t.id}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]",
                t.savedTenPercent && "border-primary/40 bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                  t.type === "entrada"
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                {t.type === "entrada" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  <span className="truncate">{t.title}</span>
                  {t.savedTenPercent && <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.category} · {PAYMENT_LABELS[t.method]} · {formatDate(t.date)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  t.type === "entrada" ? "text-success" : "text-destructive",
                )}
              >
                {t.type === "entrada" ? "+" : "−"}
                {brl(t.amount)}
              </span>
              <div className="col-span-3 flex justify-end gap-1 sm:col-span-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar transação"
                  onClick={() => {
                    setEditing(t);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Excluir transação"
                  onClick={() => {
                    removeTransaction(t.id);
                    toast.success("Transação removida");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <TransactionDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
      />
    </div>
  );
}
