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
  { id: "paypal", label: "PayPal", hint: "Conta internacional" },
] as const;

export type PaymentOptionId = (typeof PAYMENT_OPTIONS)[number]["id"];

/* ------------------------------------------------------------------ *
 * CHECKOUT HOTMART
 *
 * Cole abaixo os links de checkout dos seus produtos na Hotmart.
 * Onde encontrar: Hotmart > Produtos > (seu produto) > Página de vendas /
 * Links de checkout > copiar o link "pay.hotmart.com/...".
 *
 * Enquanto o valor continuar como placeholder, o app avisa que o
 * checkout ainda não foi configurado (em vez de abrir uma aba em branco).
 * ------------------------------------------------------------------ */
export const HOTMART_CHECKOUT = {
  monthly: "COLE_AQUI_O_LINK_DO_PLANO_MENSAL",
  yearly: "COLE_AQUI_O_LINK_DO_PLANO_ANUAL",
} as const;

/**
 * Parâmetros extras por forma de pagamento (opcional).
 * Se você usa links diferentes ou quer pré-selecionar o meio de pagamento
 * no checkout da Hotmart, ajuste aqui. Deixe "" para não enviar nada.
 */
export const HOTMART_PAYMENT_PARAM: Record<PaymentOptionId, string> = {
  pix: "PIX",
  cartao: "CREDIT_CARD",
  paypal: "PAYPAL",
};

export function isCheckoutConfigured(cycle: "monthly" | "yearly") {
  const url = HOTMART_CHECKOUT[cycle];
  return typeof url === "string" && url.startsWith("http");
}

/** Monta a URL final do checkout, com e-mail e meio de pagamento quando houver. */
export function buildCheckoutUrl(
  cycle: "monthly" | "yearly",
  payment: PaymentOptionId,
  email?: string | null,
) {
  const base = HOTMART_CHECKOUT[cycle];
  if (!base.startsWith("http")) return null;
  try {
    const url = new URL(base);
    const method = HOTMART_PAYMENT_PARAM[payment];
    if (method) url.searchParams.set("paymentMethod", method);
    if (email) url.searchParams.set("email", email);
    return url.toString();
  } catch {
    return null;
  }
}

