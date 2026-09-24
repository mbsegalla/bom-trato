const quantityFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatQuantity(quantityInThousandths: number): string {
  return quantityFormatter.format(quantityInThousandths / 1000);
}
