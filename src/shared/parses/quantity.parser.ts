export function parseQuantity(value: string): string | null {
  const normalized = value.trim().replace(',', '.');

  if (!/^\d{1,6}(?:\.\d{1,3})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ''] = normalized.split('.');

  const quantityInThousandths = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));

  if (!Number.isSafeInteger(quantityInThousandths) || quantityInThousandths < 1) {
    return null;
  }

  return normalized;
}
