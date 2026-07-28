import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_LABELS,
  brl,
  type PaymentMethod,
  type Transaction,
  type TxType,
} from "@/lib/aurin";
import { useAurinStore } from "@/store/aurin-store";

const schema = z.object({
  title: z.string().trim().min(2, "Informe um título").max(80, "Máximo de 80 caracteres"),
  amount: z
    .number({ invalid_type_error: "Informe um valor" })
    .positive("O valor deve ser maior que zero")
    .max(100_000_000, "Valor muito alto"),
  category: z.string().trim().min(1, "Escolha uma categoria"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  method: z.enum(["pix", "cartao", "dinheiro", "transferencia"]),
  type: z.enum(["entrada", "saida"]),
  savedTenPercent: z.boolean(),
});

const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
}

export function TransactionDialog({ open, onOpenChange, editing }: Props) {
  const addTransaction = useAurinStore((s) => s.addTransaction);
  const updateTransaction = useAurinStore((s) => s.updateTransaction);

  const [type, setType] = useState<TxType>("saida");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [tithe, setTithe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setTitle(editing.title);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date);
      setMethod(editing.method);
      setTithe(editing.savedTenPercent);
    } else {
      setType("saida");
      setTitle("");
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(today());
      setMethod("pix");
      setTithe(true);
    }
    setErrors({});
  }, [open, editing]);

  const categories = type === "entrada" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const numericAmount = Number(amount.replace(",", "."));

  function handleTypeChange(next: string) {
    const value = next as TxType;
    setType(value);
    setCategory(value === "entrada" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  function submit() {
    const parsed = schema.safeParse({
      title,
      amount: numericAmount,
      category,
      date,
      method,
      type,
      savedTenPercent: type === "entrada" ? tithe : false,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }

    if (editing) {
      updateTransaction(editing.id, parsed.data);
      toast.success("Transação atualizada");
    } else {
      addTransaction(parsed.data);
      toast.success(
        parsed.data.savedTenPercent
          ? `Registrado! ${brl(parsed.data.amount * 0.1)} foram ao Tesouro Pessoal.`
          : "Transação registrada",
      );
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar moeda" : "Registrar nova moeda"}
          </DialogTitle>
          <DialogDescription>
            Toda moeda registrada fortalece o seu tesouro e rende XP na jornada.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saida">Ouro Saída</TabsTrigger>
            <TabsTrigger value="entrada">Ouro Entrada</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="tx-title">Título</Label>
            <Input
              id="tx-title"
              value={title}
              maxLength={80}
              placeholder="Ex.: Salário mensal"
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tx-amount">Valor (R$)</Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                value={amount}
                placeholder="0,00"
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "entrada" && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
                  Guardar 10% para o Tesouro Pessoal
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Primeira lei de Arkad: pague-se primeiro.
                  {numericAmount > 0 && ` Serão ${brl(numericAmount * 0.1)}.`}
                </p>
              </div>
              <Switch checked={tithe} onCheckedChange={setTithe} className="shrink-0" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-gold text-primary-foreground hover:opacity-90">
            {editing ? "Salvar" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
