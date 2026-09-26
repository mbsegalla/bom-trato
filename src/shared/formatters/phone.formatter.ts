export function normalizeBrazilianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }

  return digits;
}

export function isValidBrazilianPhone(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed || !/^\+?[\d\s().-]+$/.test(trimmed)) {
    return false;
  }

  const digits = normalizeBrazilianPhone(trimmed);

  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }

  const areaCode = Number(digits.slice(0, 2));

  if (areaCode < 11 || areaCode > 99) {
    return false;
  }

  const number = digits.slice(2);

  if (digits.length === 11) {
    return /^9\d{8}$/.test(number);
  }

  return /^[2-5]\d{7}$/.test(number);
}

export function formatBrazilianPhoneInput(value: string): string {
  const digits = normalizeBrazilianPhone(value).slice(0, 11);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  const firstGroupLength = number.startsWith('9') ? 5 : 4;

  const firstGroup = number.slice(0, firstGroupLength);
  const secondGroup = number.slice(firstGroupLength, firstGroupLength + 4);

  if (!secondGroup) {
    return `(${areaCode}) ${firstGroup}`;
  }

  return `(${areaCode}) ${firstGroup}-${secondGroup}`;
}

export function formatBrazilianPhone(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  if (!isValidBrazilianPhone(value)) {
    return value;
  }

  return formatBrazilianPhoneInput(value);
}
