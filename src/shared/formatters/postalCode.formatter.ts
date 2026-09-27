export function normalizeBrazilianPostalCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function formatBrazilianPostalCodeInput(value: string): string {
  const digits = normalizeBrazilianPostalCode(value);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatBrazilianPostalCode(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return formatBrazilianPostalCodeInput(value);
}
