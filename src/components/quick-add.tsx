import { useState } from "react";
import { Coins, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/currency-input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, brl, type TxType } from "@/lib/aurin";
import { useAurinStore } from "@/store/aurin-store";

/** Registro relâmpago direto do painel: três campos e pronto. */
export function QuickAdd() {
  const addTransaction = useAurinStore((s) => s.addTransaction);
  const customCategories = useAurinStore((s) => s.customCategories);

  const [type, setType] = useState<TxType>("saida");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  const categories =
    type === "entrada" ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES, ...customCategories];

  const save = () => {
    if (!title.trim() || amount <= 0) return;
    addTransaction({
      title: title.trim(),
      amount,
      type,
      category,
      date: new Date().toISOString().slice(0, 10),
      method: type === "entrada" ? "transferencia" : "pix",
      savedTenPercent: type === "entrada",
    });
    toast.success(
      type === "entrada"
        ? `Registrado! ${brl(amount * 0.1)} seguiram para o seu Tesouro.`
        : "Registrado. Clareza é o primeiro passo da paz.",
    );
    setTitle("");
    setAmount(0);
  };

  return (
    <Card className="reveal-step border-primary/25">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-primary" /> Registro relâmpago
        </CardTitle>
        <CardDescription>Anote agora, em segundos — depois você organiza.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs
          value={type}
          onValueChange={(v) => {
            const next = v as TxType;
            setType(next);
            setCategory(next === "entrada" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saida">Saiu</TabsTrigger>
            <TabsTrigger value="entrada">Entrou</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="grid gap-1.5">
            <Label htmlFor="qa-title" className="text-xs">
              O que foi
            </Label>
            <Input
              id="qa-title"
              value={title}
              maxLength={50}
              placeholder="Ex.: Mercado"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qa-amount" className="text-xs">
              Valor
            </Label>
            <CurrencyInput id="qa-amount" value={amount} onValueChange={setAmount} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Categoria</Label>
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
          <div className="flex items-end">
            <Button
              className="w-full bg-gold text-primary-foreground hover:opacity-90 sm:w-auto"
              disabled={!title.trim() || amount <= 0}
              onClick={save}
            >
              <Plus className="h-4 w-4" />
              <span className="sm:hidden">Registrar</span>
            </Button>
          </div>
        </div>

        {type === "entrada" && amount > 0 && (
          <p className="flex items-center gap-2 text-xs text-primary">
            <Coins className="h-3.5 w-3.5" /> {brl(amount * 0.1)} vão automaticamente para o seu
            Tesouro.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
