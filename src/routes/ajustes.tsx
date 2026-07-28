import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  Plus,
  RefreshCw,
  Repeat,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { CurrencyInput } from "@/components/currency-input";
import { Badge } from "@/components/ui/badge";
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
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  brl,
  type PaymentMethod,
  type TxType,
} from "@/lib/aurin";
import { useAurinStore } from "@/store/aurin-store";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Meus dados | AURIN" },
      {
        name: "description",
        content:
          "Ajuste seu perfil, categorias próprias, lançamentos fixos e faça backup dos seus dados no AURIN.",
      },
      { property: "og:title", content: "Meus dados | AURIN" },
      {
        property: "og:description",
        content: "Perfil, categorias, lançamentos fixos e backup da sua jornada financeira.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const profile = useAurinStore((s) => s.profile);
  const setProfile = useAurinStore((s) => s.setProfile);
  const customCategories = useAurinStore((s) => s.customCategories);
  const addCustomCategory = useAurinStore((s) => s.addCustomCategory);
  const removeCustomCategory = useAurinStore((s) => s.removeCustomCategory);
  const recurring = useAurinStore((s) => s.recurring);
  const addRecurring = useAurinStore((s) => s.addRecurring);
  const removeRecurring = useAurinStore((s) => s.removeRecurring);
  const celebrationsEnabled = useAurinStore((s) => s.celebrationsEnabled);
  const setCelebrationsEnabled = useAurinStore((s) => s.setCelebrationsEnabled);
  const loadDemoData = useAurinStore((s) => s.loadDemoData);
  const clearAll = useAurinStore((s) => s.clearAll);
  const importState = useAurinStore((s) => s.importState);

  const [newCategory, setNewCategory] = useState("");
  const [rec, setRec] = useState({
    title: "",
    amount: 0,
    type: "saida" as TxType,
    category: "Moradia",
    day: 5,
    savedTenPercent: true,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const categoryOptions =
    rec.type === "entrada"
      ? [...INCOME_CATEGORIES]
      : [...EXPENSE_CATEGORIES, ...customCategories];

  const exportData = () => {
    const state = useAurinStore.getState();
    const { celebration: _c, ...data } = state;
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => typeof v !== "function"),
    );
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup salvo. Sua jornada está guardada com você.");
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("formato");
      importState(parsed);
      toast.success("Dados restaurados com sucesso.");
    } catch {
      toast.error("Não consegui ler esse arquivo. Use um backup exportado pelo AURIN.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="reveal-step">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Seu espaço</p>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Meus dados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tudo aqui é seu e fica no seu aparelho. Ajuste no seu ritmo, sem pressa.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Card className="reveal-step">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-primary" /> Meu perfil
            </CardTitle>
            <CardDescription>Serve para personalizar mensagens e projeções.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={profile.name}
                maxLength={40}
                onChange={(e) => setProfile({ name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-income">Renda mensal</Label>
                <CurrencyInput
                  id="p-income"
                  value={profile.monthlyIncome}
                  onValueChange={(v) => setProfile({ monthlyIncome: v })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-years">Horizonte do sonho (anos)</Label>
                <Input
                  id="p-years"
                  type="number"
                  min={1}
                  max={40}
                  value={profile.dreamYears}
                  onChange={(e) =>
                    setProfile({ dreamYears: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-dream">Sonho principal</Label>
                <Input
                  id="p-dream"
                  value={profile.dreamName}
                  maxLength={40}
                  onChange={(e) => setProfile({ dreamName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-target">Valor do sonho</Label>
                <CurrencyInput
                  id="p-target"
                  value={profile.dreamTarget}
                  onValueChange={(v) => setProfile({ dreamTarget: v })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Celebrações ao guardar</p>
                <p className="text-xs text-muted-foreground">
                  Mostra o Eco do Ouro sempre que você avança.
                </p>
              </div>
              <Switch
                checked={celebrationsEnabled}
                onCheckedChange={setCelebrationsEnabled}
                aria-label="Ativar celebrações"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card className="reveal-step">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tags className="h-4 w-4 text-primary" /> Minhas categorias
            </CardTitle>
            <CardDescription>
              Crie categorias com a cara da sua vida. Elas aparecem no cadastro de despesas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCategory}
                maxLength={30}
                placeholder="Ex.: Escola das crianças"
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategory.trim()) {
                    addCustomCategory(newCategory);
                    setNewCategory("");
                  }
                }}
              />
              <Button
                type="button"
                disabled={!newCategory.trim()}
                onClick={() => {
                  addCustomCategory(newCategory);
                  setNewCategory("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma categoria própria ainda — as padrão já cobrem bastante coisa.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customCategories.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1 py-1">
                    {c}
                    <button
                      type="button"
                      aria-label={`Remover ${c}`}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCustomCategory(c)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lançamentos fixos */}
        <Card className="reveal-step lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-4 w-4 text-primary" /> Lançamentos fixos
            </CardTitle>
            <CardDescription>
              Salário, aluguel, assinaturas: cadastre uma vez e o AURIN registra sozinho todo mês.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="r-title">Descrição</Label>
                <Input
                  id="r-title"
                  value={rec.title}
                  maxLength={50}
                  placeholder="Ex.: Aluguel"
                  onChange={(e) => setRec({ ...rec, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-amount">Valor</Label>
                <CurrencyInput
                  id="r-amount"
                  value={rec.amount}
                  onValueChange={(v) => setRec({ ...rec, amount: v })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={rec.type}
                  onValueChange={(v: TxType) =>
                    setRec({
                      ...rec,
                      type: v,
                      category: v === "entrada" ? "Salário" : "Moradia",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-day">Dia do mês</Label>
                <Input
                  id="r-day"
                  type="number"
                  min={1}
                  max={31}
                  value={rec.day}
                  onChange={(e) =>
                    setRec({ ...rec, day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Categoria</Label>
                <Select
                  value={rec.category}
                  onValueChange={(v) => setRec({ ...rec, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {rec.type === "entrada" && (
                <div className="flex items-center gap-3 rounded-xl border border-border px-3 sm:col-span-2">
                  <Switch
                    id="r-tithe"
                    checked={rec.savedTenPercent}
                    onCheckedChange={(v) => setRec({ ...rec, savedTenPercent: v })}
                  />
                  <Label htmlFor="r-tithe" className="text-xs font-normal">
                    Separar 10% para o Tesouro automaticamente
                  </Label>
                </div>
              )}
              <div className="flex items-end">
                <Button
                  className="w-full bg-gold text-primary-foreground hover:opacity-90"
                  disabled={!rec.title.trim() || rec.amount <= 0}
                  onClick={() => {
                    addRecurring({
                      title: rec.title.trim(),
                      amount: rec.amount,
                      type: rec.type,
                      category: rec.category,
                      method: (rec.type === "entrada" ? "transferencia" : "pix") as PaymentMethod,
                      day: rec.day,
                      savedTenPercent: rec.type === "entrada" && rec.savedTenPercent,
                    });
                    setRec({ ...rec, title: "", amount: 0 });
                    toast.success("Lançamento fixo criado. Ele entra sozinho todo mês.");
                  }}
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>

            {recurring.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento fixo ainda. Comece pelo que se repete todo mês — isso tira peso da
                sua cabeça.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {recurring.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.category} · todo dia {r.day}
                        {r.savedTenPercent ? " · 10% ao Tesouro" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          r.type === "entrada"
                            ? "text-sm font-semibold text-success"
                            : "text-sm font-semibold"
                        }
                      >
                        {r.type === "entrada" ? "+" : "−"}
                        {brl(r.amount)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover ${r.title}`}
                        onClick={() => removeRecurring(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <SecurityCard />
        <ReminderCard />

        {/* Backup */}
        <Card className="reveal-step lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Backup e recomeço
            </CardTitle>
            <CardDescription>
              Seus dados ficam apenas neste aparelho. Exporte de tempos em tempos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4" /> Exportar meus dados
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importar backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={loadDemoData}>
              <RefreshCw className="h-4 w-4" /> Carregar exemplo
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                clearAll();
                toast.success("Tudo limpo. Sua jornada recomeça agora.");
              }}
            >
              <Trash2 className="h-4 w-4" /> Começar do zero
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
