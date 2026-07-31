import { createFileRoute } from "@tanstack/react-router";
import { Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e termos | AURIN" },
      {
        name: "description",
        content:
          "Como o AURIN cuida dos seus dados: tudo fica no seu aparelho, o backup na nuvem é opcional e o e-mail serve apenas para reconhecer sua assinatura.",
      },
      { property: "og:title", content: "Privacidade e termos | AURIN" },
      {
        property: "og:description",
        content:
          "Seus números ficam no seu aparelho. Backup na nuvem é opcional e o e-mail só reconhece a assinatura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacidadePage,
});

const BLOCKS = [
  {
    icon: Smartphone,
    title: "Seus números ficam com você",
    text: "Transações, metas, cartões e planos de quitação são guardados no seu próprio aparelho. O AURIN funciona sem internet e não envia seus valores para ninguém.",
  },
  {
    icon: Lock,
    title: "Backup na nuvem é opcional",
    text: "Se você entrar com o Google, pode salvar uma cópia dos seus dados para restaurar em outro aparelho. Só você acessa essa cópia, e ela pode ser apagada a qualquer momento em Minha conta.",
  },
  {
    icon: Mail,
    title: "Por que pedimos seu e-mail",
    text: "O e-mail da conta serve para reconhecer sua assinatura Premium e para avisos importantes sobre o serviço. Não vendemos nem compartilhamos seus dados.",
  },
  {
    icon: ShieldCheck,
    title: "Assinatura Premium",
    text: "A cobrança é feita pela Hotmart, que cuida do pagamento e da emissão. Você pode cancelar quando quiser pela própria Hotmart; o acesso Premium continua até o fim do período pago e o app segue funcionando na versão gratuita.",
  },
] as const;

function PrivacidadePage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Privacidade e termos
          </h1>
          <p className="text-sm text-muted-foreground">
            Em palavras simples: o AURIN é um guardião discreto. Ele existe para te dar clareza, não
            para colecionar seus dados.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {BLOCKS.map((block) => (
            <Card key={block.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <block.icon className="h-4 w-4" />
                  </span>
                  {block.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {block.text}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uso do AURIN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              O AURIN é uma ferramenta de organização e educação financeira. Ele mostra cenários e
              caminhos possíveis, mas não é consultoria de investimentos nem promessa de
              rendimento. As decisões seguem sendo suas.
            </p>
            <p>
              Você pode exportar ou apagar todos os seus dados em qualquer momento na página “Meus
              dados”. Ao apagar, a jornada volta ao início — não guardamos histórico paralelo.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
