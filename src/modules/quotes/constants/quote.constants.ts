import type { QuoteListStatus, QuoteStatus } from '../types/quote.types';

export const quoteStatusOptions: {
  value: QuoteListStatus;
  label: string;
}[] = [
  {
    value: 'ALL',
    label: 'Todos',
  },
  {
    value: 'DRAFT',
    label: 'Rascunhos',
  },
  {
    value: 'SENT',
    label: 'Enviados',
  },
  {
    value: 'APPROVED',
    label: 'Aprovados',
  },
  {
    value: 'DECLINED',
    label: 'Recusados',
  },
  {
    value: 'CANCELED',
    label: 'Cancelados',
  },
];

export function isQuoteExpired(status: QuoteStatus, validUntil: Date | null): boolean {
  return status === 'SENT' && validUntil !== null && validUntil.getTime() <= Date.now();
}

export function getQuoteStatusLabel(status: QuoteStatus, validUntil?: Date | null): string {
  if (isQuoteExpired(status, validUntil ?? null)) {
    return 'Expirado';
  }

  switch (status) {
    case 'DRAFT':
      return 'Rascunho';

    case 'SENT':
      return 'Enviado';

    case 'APPROVED':
      return 'Aprovado';

    case 'DECLINED':
      return 'Recusado';

    case 'CANCELED':
      return 'Cancelado';
  }
}
