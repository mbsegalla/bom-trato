const brlCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const brlCurrencyInputFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBrlCurrency(amountInCents: number): string {
  return brlCurrencyFormatter.format(amountInCents / 100);
}

export function formatBrlCurrencyInput(amountInCents: number): string {
  return brlCurrencyInputFormatter.format(amountInCents / 100);
}
