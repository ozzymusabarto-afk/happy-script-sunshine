import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard as CardIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
import { useAurinHydrated } from "@/hooks/use-aurin-hydrated";
import {
  CARD_BRANDS,
  CARD_COLORS,
  brl,
  daysUntil,
  formatDate,
  monthLabel,
  type CardBrand,
  type CreditCard,
} from "@/lib/aurin";
import { cardGuidance } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { cardSummary, useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/cartoes")({
  head: () => ({
    meta: [
      { title: "Cartões de Crédito | AURIN" },
      {
        name: "description",
        content:
          "Cadastre seus cartões, acompanhe limite disponível, fechamento, vencimento e faturas em aberto.",
      },
      { property: "og:title", content: "Cartões de Crédito | AURIN" },
      {
        property: "og:description",
        content: "Limite, fatura atual e próxima fatura de cada cartão em um só lugar.",
      },
    ],
  }),
  component: CardsPage,
});

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function CardsPage() {
  const hydrated = useAurinHydrated();
  const cards = useAurinStore((s) => s.cards);
  const transactions = useAurinStore((s) => s.transactions);
  const paidInvoices = useAurinStore((s) => s.paidInvoices);
  const payInvoice = useAurinStore((s) => s.payInvoice);
  const removeCard = useAurinStore((s) => s.removeCard);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const summaries = useMemo(
    () => cards.map((c) => ({ card: c, ...cardSummary(c, transactions, paidInvoices) })),
    [cards, transactions, paidInvoices],
  );

  const active = summaries.find((s) => s.card.id === selected) ?? summaries[0] ?? null;

  const totals = summaries.reduce(
    (acc, s) => ({
      limit: acc.limit + s.card.limit,
      committed: acc.committed + s.committed,
      available: acc.available + s.available,
    }),
    { limit: 0, committed: 0, available: 0 },
  );

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Cartões de Crédito</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            "Melhor um pouco de cautela do que um grande arrependimento." Controle cada limite antes
            que ele controle você.
          </p>
        </div>
        <Button
          className="shrink-0 bg-gold text-primary-foreground hover:opacity-90"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo cartão</span>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Limite total" value={brl(totals.limit)} />
        <Stat label="Comprometido" value={brl(totals.committed)} tone="destructive" />
        <Stat label="Disponível" value={brl(totals.available)} tone="success" />
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum cartão cadastrado ainda. Adicione o primeiro para registrar compras parceladas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => {
            const due = s.current?.due ?? s.next?.due;
            const days = due ? daysUntil(due) : null;
            const warn = s.usage >= 70;
            return (
              <div
                key={s.card.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(s.card.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(s.card.id);
                }}
                className={cn(
                  "rounded-2xl border p-0 text-left transition-all",
                  active?.card.id === s.card.id
                    ? "border-primary/60 shadow-gold"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "rounded-t-2xl bg-gradient-to-br p-5 text-white",
                    s.card.color || CARD_COLORS[0],
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <CardIcon className="h-6 w-6 opacity-90" />
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-90">
                      {s.card.brand}
                    </span>
                  </div>
                  <p className="mt-8 truncate font-display text-lg font-bold">{s.card.name}</p>
                  <p className="text-xs opacity-80">
                    Fecha dia {s.card.closingDay} · Vence dia {s.card.dueDay}
                  </p>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Disponível</span>
                    <span className="font-display text-lg font-bold text-gold">
                      {brl(s.available)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, s.usage)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {brl(s.committed)} de {brl(s.card.limit)} usados ({s.usage.toFixed(0)}%)
                  </p>

                  {warn && (
                    <p className="flex items-start gap-1.5 text-xs text-warning">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {cardGuidance({
                          card: s.card.name,
                          usage: s.usage,
                          free: s.available,
                          money: brl,
                          seed: (s.card.name.length % 7) / 7,
                        })}
                      </span>
                    </p>
                  )}
                  {days !== null && days <= 3 && days >= 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-warning">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      Fatura vence em {days} dia{days === 1 ? "" : "s"}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(s.card);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover ${s.card.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.committed > 0) {
                          toast.error("Existe fatura em aberto neste cartão.");
                          return;
                        }
                        removeCard(s.card.id);
                        toast.success("Cartão removido");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InvoicePanel
            title={`Fatura atual — ${active.current ? monthLabel(active.current.key) : "—"}`}
            invoice={active.current}
            onPay={() =>
              active.current &&
              (payInvoice(active.card.id, active.current.key),
              toast.success("Fatura marcada como paga"))
            }
          />
          <InvoicePanel
            title={`Próxima fatura — ${active.next ? monthLabel(active.next.key) : "—"}`}
            invoice={active.next}
          />
        </div>
      )}

      <CardDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
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
            "mt-1 font-display text-2xl font-extrabold",
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

function InvoicePanel({
  title,
  invoice,
  onPay,
}: {
  title: string;
  invoice?: {
    key: string;
    due: string;
    total: number;
    items: { id: string; title: string; date: string; amount: number }[];
    paid: boolean;
  };
  onPay?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <CardTitle className="truncate text-base">{title}</CardTitle>
        {invoice && (
          <span className="shrink-0 font-display text-lg font-bold text-gold">
            {brl(invoice.total)}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!invoice ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum lançamento.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Vencimento em {formatDate(invoice.due)}
              {invoice.paid && " · paga"}
            </p>
            <ul className="divide-y divide-border">
              {invoice.items.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 text-sm"
                >
                  <span className="truncate">{item.title}</span>
                  <span className="shrink-0 text-muted-foreground">{brl(item.amount)}</span>
                </li>
              ))}
            </ul>
            {invoice.items.length > 8 && (
              <p className="text-xs text-muted-foreground">
                +{invoice.items.length - 8} outros lançamentos
              </p>
            )}
            {onPay && !invoice.paid && (
              <Button
                onClick={onPay}
                className="w-full bg-gold text-primary-foreground hover:opacity-90"
              >
                Pagar fatura
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CardDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CreditCard | null;
}) {
  const addCard = useAurinStore((s) => s.addCard);
  const updateCard = useAurinStore((s) => s.updateCard);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState<CardBrand>("Visa");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("20");
  const [dueDay, setDueDay] = useState("28");
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setBrand(editing?.brand ?? "Visa");
    setLimit(editing ? String(editing.limit) : "");
    setClosingDay(String(editing?.closingDay ?? 20));
    setDueDay(String(editing?.dueDay ?? 28));
    setColor(editing?.color ?? CARD_COLORS[0]);
    setError("");
  }, [open, editing]);

  function submit() {
    const value = Number(limit.replace(",", "."));
    if (name.trim().length < 2) return setError("Informe o nome do cartão");
    if (!Number.isFinite(value) || value <= 0) return setError("Informe um limite válido");
    const payload = {
      name: name.trim(),
      brand,
      limit: value,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
    };
    if (editing) {
      updateCard(editing.id, payload);
      toast.success("Cartão atualizado");
    } else {
      addCard(payload);
      toast.success("Cartão cadastrado");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar cartão" : "Novo cartão de crédito"}
          </DialogTitle>
          <DialogDescription>
            O limite disponível é calculado automaticamente a partir das faturas em aberto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="card-name">Nome</Label>
            <Input
              id="card-name"
              value={name}
              maxLength={40}
              placeholder="Ex.: Cartão Ouro"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="card-limit">Limite total (R$)</Label>
              <Input
                id="card-limit"
                inputMode="decimal"
                value={limit}
                placeholder="0,00"
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Bandeira</Label>
              <Select value={brand} onValueChange={(v) => setBrand(v as CardBrand)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Dia de fechamento</Label>
              <Select value={closingDay} onValueChange={setClosingDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Dia de vencimento</Label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      Dia {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cor do cartão</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Selecionar cor ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-9 w-14 rounded-lg bg-gradient-to-br ring-offset-2 ring-offset-background",
                    c,
                    color === c && "ring-2 ring-primary",
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-gold text-primary-foreground hover:opacity-90">
            {editing ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
