import { useState } from "react";
import { ArrowLeft, ArrowRight, Coins, Sparkles, Target, Wallet } from "lucide-react";

import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { brl } from "@/lib/aurin";
import { useAurinStore } from "@/store/aurin-store";

const DREAM_SUGGESTIONS = [
  { name: "Reserva de emergência", target: 20000, years: 2 },
  { name: "Casa própria", target: 120000, years: 8 },
  { name: "Viagem dos sonhos", target: 15000, years: 2 },
  { name: "Liberdade financeira", target: 500000, years: 15 },
];

/** Ritual de entrada: quatro perguntas leves para o app nascer com a vida real do usuário. */
export function OnboardingDialog() {
  const hasOnboarded = useAurinStore((s) => s.hasOnboarded);
  const completeOnboarding = useAurinStore((s) => s.completeOnboarding);
  const loadDemoData = useAurinStore((s) => s.loadDemoData);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState(0);
  const [dreamName, setDreamName] = useState("");
  const [dreamTarget, setDreamTarget] = useState(0);
  const [dreamYears, setDreamYears] = useState(5);
  const [startingBalance, setStartingBalance] = useState(0);

  if (hasOnboarded) return null;

  const canAdvance = [dreamName.trim().length > 1 && dreamTarget > 0, income > 0, true][step];
  const monthlyTithe = income * 0.1;

  const finish = () =>
    completeOnboarding({
      name: name.trim() || "Viajante",
      monthlyIncome: income,
      dreamName,
      dreamTarget,
      dreamYears,
      startingBalance,
    });

  return (
    <Dialog open>
      <DialogContent
        className="max-w-lg gap-5 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Ritual de entrada</p>
          <DialogTitle className="font-display text-2xl">
            {
              [
                "Qual é o seu maior sonho?",
                "Quanto você precisa por mês para viver bem?",
                "E qual é a sua maior paz hoje?",
              ][step]
            }
          </DialogTitle>
          <DialogDescription>
            {
              [
                "Um destino claro transforma guardar dinheiro em algo prazeroso.",
                "Pode ser aproximado. É com isso que calculamos o seu Tempo de Paz.",
                "Escolha o que mais pesa hoje. Tudo aqui é sem cobrança e sem julgamento.",
              ][step]
            }
          </DialogDescription>
        </div>

        <Progress value={((step + 1) / 3) * 100} className="h-1.5" />

        {step === 1 && (
          <div className="space-y-3">
            <Label htmlFor="ob-income">Renda mensal média</Label>
            <CurrencyInput id="ob-income" value={income} onValueChange={setIncome} autoFocus />
            {income > 0 && (
              <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">
                <Coins className="mr-1 inline h-4 w-4" />
                Guardando 10%, seu Tesouro cresce {brl(monthlyTithe)} por mês —{" "}
                {brl(monthlyTithe * 12)} no primeiro ano.
              </p>
            )}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DREAM_SUGGESTIONS.map((d) => (
                <Button
                  key={d.name}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDreamName(d.name);
                    setDreamTarget(d.target);
                    setDreamYears(d.years);
                  }}
                >
                  {d.name}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-dream">Nome do sonho</Label>
              <Input
                id="ob-dream"
                value={dreamName}
                maxLength={40}
                placeholder="Ex.: Casa própria"
                onChange={(e) => setDreamName(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ob-target">Quanto custa</Label>
                <CurrencyInput id="ob-target" value={dreamTarget} onValueChange={setDreamTarget} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-years">Em quantos anos</Label>
                <Input
                  id="ob-years"
                  type="number"
                  min={1}
                  max={40}
                  value={dreamYears}
                  onChange={(e) => setDreamYears(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PEACE_GOALS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={peaceGoal === g ? "default" : "outline"}
                  className={peaceGoal === g ? "bg-gold text-primary-foreground" : ""}
                  onClick={() => setPeaceGoal(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ob-name">Como te chamamos? (opcional)</Label>
                <Input
                  id="ob-name"
                  value={name}
                  maxLength={40}
                  placeholder="Ex.: Ana"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-balance">Já tem algo guardado? (opcional)</Label>
                <CurrencyInput
                  id="ob-balance"
                  value={startingBalance}
                  onValueChange={setStartingBalance}
                />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Seu ponto de partida
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" /> Renda: {brl(income)} / mês
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" /> {dreamName || "Seu sonho"}: {brl(dreamTarget)}{" "}
                  em {dreamYears} anos
                </li>
                <li className="flex items-center gap-2">
                  <Coins className="h-3.5 w-3.5" /> Tesouro inicial: {brl(startingBalance)}
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          ) : (
            <Button variant="ghost" className="text-muted-foreground" onClick={loadDemoData}>
              Ver com dados de exemplo
            </Button>
          )}
          {step < 2 ? (
            <Button
              disabled={!canAdvance}
              className="bg-gold text-primary-foreground hover:opacity-90"
              onClick={() => setStep((s) => s + 1)}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="bg-gold text-primary-foreground hover:opacity-90"
              onClick={finish}
            >
              Começar minha jornada <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
