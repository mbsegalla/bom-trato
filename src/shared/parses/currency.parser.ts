export function parseBrlCurrencyToCents(value: string): number | null {
  let normalized = value.trim().replace(/\s/g, '').replace(/^R\$/i, '');

  if (normalized.length === 0) {
    return null;
  }

  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    const parts = normalized.split('.');

    if (parts.length > 2) {
      const decimalPart = parts.at(-1);

      if (decimalPart === undefined) {
        return null;
      }

      normalized = decimalPart.length <= 2 ? `${parts.slice(0, -1).join('')}.${decimalPart}` : parts.join('');
    } else if (parts.length === 2 && parts[1]?.length === 3) {
      normalized = parts.join('');
    }
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const amountInCents = Math.round(amount * 100);

  if (!Number.isSafeInteger(amountInCents) || amountInCents < 0) {
    return null;
  }

  return amountInCents;
}
