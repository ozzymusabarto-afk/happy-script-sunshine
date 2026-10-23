import { DEFAULT_MONTHLY_RATE } from "@/lib/impact";

export function SimulationNotice({ customRate = false }: { customRate?: boolean }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
      Simulação educativa, não é promessa de rendimento nem recomendação de investimento.
      {customRate
        ? " Usa a taxa e os aportes escolhidos por você."
        : ` Usa uma taxa hipotética de ${(DEFAULT_MONTHLY_RATE * 100).toLocaleString("pt-BR")}% ao mês, sem novos aportes.`}
      {" "}Não considera impostos, taxas ou inflação. Os resultados reais podem variar.
    </p>
  );
}