/**
 * Modelo Freemium do AURIN.
 *
 * Nada aqui bloqueia o essencial: registrar a vida financeira é sempre grátis.
 * O Premium abre ferramentas de antecipação (simular decisões, prever semanas
 * apertadas) e a multiplicação de sonhos e resgates.
 */

export type PlanId = "free" | "premium";

export const FREE_LIMITS = {
  /** Cofres de sonho além do Tesouro pessoal. */
  dreams: 1,
  /** Resgates de Paz ativos ao mesmo tempo. */
  rescues: 1,
} as const;

export const PREMIUM_PRICE = {
  monthly: 9.9,
  yearly: 89,
  monthlyLabel: "R$ 9,90",
  yearlyLabel: "R$ 89,00",
  /** Economia aproximada do plano anual, em meses. */
  freeMonths: 2,
} as const;

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "simulador",
    name: "Simulador de Decisões",
    description: "Antes de gastar, veja quanto tempo de paz aquela compra custa.",
  },
  {
    id: "cofres",
    name: "Sonhos e Resgates ilimitados",
    description: "Guarde para vários sonhos e liberte vários compromissos ao mesmo tempo.",
  },
  {
    id: "consultor",
    name: "Consultor de Paz Inteligente",
    description: "Aviso antecipado de semanas apertadas e um plano de libertação acelerado.",
  },
];

export const FREE_FEATURES: string[] = [
  "Registro ilimitado de entradas e escolhas",
  "Cartões e faturas sem limite",
  "Calculadora de Tempo de Paz (dias e meses)",
  "1 Resgate de Paz ativo",
  "1 cofre de sonho",
  "Linguagem simples, sem jargão",
];

export const PAYMENT_OPTIONS = [
  { id: "pix", label: "Pix", hint: "Aprovação na hora" },
  { id: "cartao", label: "Cartão de Crédito", hint: "Renova sozinho" },
  { id: "mercadopago", label: "Mercado Pago", hint: "Saldo ou cartão" },
  { id: "paypal", label: "PayPal", hint: "Conta internacional" },
] as const;

export type PaymentOptionId = (typeof PAYMENT_OPTIONS)[number]["id"];
