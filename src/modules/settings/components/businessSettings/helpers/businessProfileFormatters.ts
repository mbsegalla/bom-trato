import type { OrganizationDocumentType } from '../../../types/business.types';

export function formatBusinessDocument(type: OrganizationDocumentType | null, value: string | null): string {
  if (!value || !type) return '';
  return formatBusinessDocumentInput(type, value);
}

export function formatBusinessDocumentInput(type: OrganizationDocumentType | '', value: string): string {
  const digits = value.replace(/\D/g, '');

  if (type === 'CPF') {
    return digits
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  if (type === 'CNPJ') {
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return '';
}

export function formatBusinessPostalCode(value: string | null): string {
  if (!value) return '';
  return value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}
