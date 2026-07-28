import { forwardRef } from "react";

import { Input } from "@/components/ui/input";

/**
 * Campo de valor em reais com máscara por centavos.
 * O usuário digita apenas números: 1250 → R$ 12,50 → R$ 1.250,00.
 */
export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Valor em reais (ex.: 1250.5). */
  value: number;
  onValueChange: (value: number) => void;
}

const fmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onValueChange, placeholder = "R$ 0,00", ...rest }, ref) {
    const display = value > 0 ? `R$ ${fmt.format(value)}` : "";

    return (
      <Input
        {...rest}
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
          onValueChange(digits ? Number(digits) / 100 : 0);
        }}
      />
    );
  },
);
