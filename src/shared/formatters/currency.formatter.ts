const brlCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBrlCurrency(amountInCents: number): string {
  return brlCurrencyFormatter.format(amountInCents / 100);
}
