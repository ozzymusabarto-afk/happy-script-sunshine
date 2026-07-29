import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  Compass,
  Crown,
  Heart,
  Lock,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";

import { PremiumButton } from "@/components/premium-gate";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EXPECTATIONS,
  FAQ,
  FIRST_STEPS,
  FREE_BENEFITS,
  PREMIUM_BENEFITS,
  PRINCIPLES,
  ROUTINE,
  SCREENS,
} from "@/lib/manual-content";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Guia do AURIN | Como usar e o que esperar" },
      {
        name: "description",
        content:
          "O manual do AURIN: os princípios que sustentam o app, por que cada regra funciona, como usar cada tela e o que a versão gratuita já entrega.",
      },
      { property: "og:title", content: "Guia do AURIN | Como usar e o que esperar" },
      {
        property: "og:description",
        content: "Entenda os princípios, a rotina e as telas do AURIN em poucos minutos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManualPage,
});

const SECTIONS = [
  { id: "boas-vindas", label: "Boas-vindas" },
  { id: "o-que-esperar", label: "O que esperar" },
  { id: "principios", label: "Os princípios" },
  { id: "primeiros-passos", label: "Primeiros passos" },
  { id: "telas", label: "Tela por tela" },
  { id: "rotina", label: "Rotina" },
  { id: "privacidade", label: "Privacidade" },
  { id: "planos", label: "Gratuito e Premium" },
  { id: "duvidas", label: "Dúvidas" },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 font-display text-xl font-bold tracking-tight sm:text-2xl"
    >
      {children}
    </h2>
  );
}

function ManualPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-10">
      {/* Cabeçalho */}
      <header className="space-y-3">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
          <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Guia do AURIN
        </Badge>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Como usar o AURIN — e o que esperar dele
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          O AURIN não é uma planilha bonita. É um ritual diário curto que devolve o comando do seu
          dinheiro para você. Este guia explica os princípios que sustentam o app, por que cada um
          funciona e como percorrer suas telas sem se perder.
        </p>
      </header>

      {/* Índice */}
      <nav aria-label="Índice do guia" className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Neste guia
        </p>
        <ul className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Boas-vindas */}
      <section className="space-y-3">
        <SectionTitle id="boas-vindas">Boas-vindas</SectionTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A maioria das pessoas não perde o controle do dinheiro por falta de matemática. Perde por
          falta de um sistema simples o bastante para ser repetido todos os dias. O AURIN existe
          para isso: poucas decisões, tomadas uma vez, sustentadas por um minuto diário.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aqui você não é cobrado por um café caro. Você é acompanhado enquanto constrói um tesouro,
          quita o que pesa e recupera a paz de olhar para o extrato sem apertar o peito.
        </p>
      </section>

      {/* O que esperar */}
      <section className="space-y-4">
        <SectionTitle id="o-que-esperar">O que esperar</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {EXPECTATIONS.map((e) => (
            <Card key={e.period} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary">{e.period}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-muted-foreground">{e.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nada aqui promete enriquecimento rápido. O que o AURIN promete é constância — e constância,
          com tempo, faz o que pressa nenhuma faz.
        </p>
      </section>

      {/* Princípios */}
      <section className="space-y-4">
        <SectionTitle id="principios">Os princípios do AURIN</SectionTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sete princípios sustentam tudo que você vê no app. Cada um vem com o motivo pelo qual
          funciona — porque seguir uma regra sem entendê-la dura pouco.
        </p>
        <div className="space-y-4">
          {PRINCIPLES.map((p) => (
            <Card key={p.id} id={p.id} className="scroll-mt-24 border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold text-sm font-bold text-primary-foreground">
                    {p.index}
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="font-display text-base font-bold">{p.name}</CardTitle>
                    <p className="mt-1 text-xs italic text-primary">{p.claim}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">O que é. </span>
                  {p.what}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Por que funciona. </span>
                  {p.why}
                </p>
                <p>
                  <span className="font-semibold text-foreground">O diferencial aqui. </span>
                  {p.edge}
                </p>
                <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-foreground">
                  <span className="font-semibold">O que muda na sua vida: </span>
                  {p.result}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Primeiros passos */}
      <section className="space-y-4">
        <SectionTitle id="primeiros-passos">Primeiros passos (5 minutos)</SectionTitle>
        <ol className="space-y-3">
          {FIRST_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Telas */}
      <section className="space-y-4">
        <SectionTitle id="telas">Tela por tela</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCREENS.map((s) => (
            <Card key={s.name} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <MapIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{s.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <p>{s.purpose}</p>
                <p className="text-foreground/80">{s.how}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Rotina */}
      <section className="space-y-4">
        <SectionTitle id="rotina">A rotina que sustenta tudo</SectionTitle>
        <div className="space-y-3">
          {ROUTINE.map((r) => (
            <div key={r.when} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{r.when}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacidade */}
      <section className="space-y-3">
        <SectionTitle id="privacidade">Privacidade e seus dados</SectionTitle>
        <div className="space-y-2 rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="flex gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Seus lançamentos ficam no seu aparelho. O app funciona offline, sem depender de conexão.
          </p>
          <p className="flex gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Você pode proteger o acesso com PIN e auto-bloqueio, com frase de recuperação própria.
          </p>
          <p className="flex gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            Backup e restauração manual estão sempre disponíveis em{" "}
            <Link to="/ajustes" className="font-medium text-primary underline-offset-2 hover:underline">
              Meus dados
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Planos */}
      <section className="space-y-4">
        <SectionTitle id="planos">O que é gratuito e o que o Premium acrescenta</SectionTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A versão gratuita não é uma amostra. Ela contém o método inteiro — é possível percorrer a
          jornada completa sem pagar nada. O Premium existe para quem quer acelerar e para quem
          decide apoiar o projeto.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4 text-success" /> Gratuito
              </CardTitle>
              <p className="text-xs text-muted-foreground">Completo de verdade, para sempre.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {FREE_BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Crown className="h-4 w-4" /> Premium
              </CardTitle>
              <p className="text-xs text-muted-foreground">Para quem quer andar mais rápido.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PREMIUM_BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Comece pelo gratuito. Se um dia o Premium fizer sentido, ele estará aqui — sem pressa e
            sem contagem regressiva.
          </p>
          <PremiumButton className="shrink-0" label="Conhecer o Premium" feature="Guia do AURIN" />
        </div>
      </section>

      {/* Dúvidas */}
      <section className="space-y-4">
        <SectionTitle id="duvidas">Dúvidas frequentes</SectionTitle>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
        <Compass className="h-5 w-5 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
          Guia lido. Agora o que importa é o primeiro registro — o resto vem da repetição.
        </p>
        <Link
          to="/"
          className="shrink-0 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ir para o Templo
        </Link>
      </div>
    </div>
  );
}
