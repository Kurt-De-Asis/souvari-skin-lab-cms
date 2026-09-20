export interface InstallmentOption {
  months: number;
  down_payment_pct: number;
  payment_method: string;
}

export interface InstallmentResult {
  down_payment: number;
  monthly_payment: number;
  total: number;
  months: number;
}

export function roundPeso(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function computePerDay(price: number, termMonths: number): number {
  const days = termMonths * 30.44;
  return roundPeso(price / days);
}

export function computeInstallments(
  price: number,
  option: InstallmentOption
): InstallmentResult {
  const downPayment = roundPeso(price * (option.down_payment_pct / 100));
  const remaining = roundPeso(price - downPayment);
  const monthlyPayment = roundPeso(remaining / option.months);

  return {
    down_payment: downPayment,
    monthly_payment: monthlyPayment,
    total: price,
    months: option.months,
  };
}