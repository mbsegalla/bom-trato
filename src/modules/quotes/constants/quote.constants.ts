import type { QuoteListStatus, QuotePaymentCondition, QuoteStatus } from '../types/quote.types';

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

export const quotePaymentConditionOptions: {
  value: QuotePaymentCondition;
  label: string;
}[] = [
  {
    value: 'AFTER_COMPLETION',
    label: 'Após a conclusão',
  },
  {
    value: 'UPFRONT',
    label: 'Pagamento integral antecipado',
  },
  {
    value: 'DOWN_PAYMENT_AND_BALANCE',
    label: 'Entrada + saldo',
  },
];

export function getQuotePaymentConditionLabel(condition: QuotePaymentCondition): string {
  return quotePaymentConditionOptions.find((option) => option.value === condition)?.label ?? condition;
}

export function getQuotePaymentConditionDescription(
  condition: QuotePaymentCondition,
  downPaymentPercentage?: number | null,
): string {
  switch (condition) {
    case 'AFTER_COMPLETION':
      return 'O valor integral será cobrado após a conclusão do serviço.';

    case 'UPFRONT':
      return 'O valor integral será cobrado antecipadamente após a aprovação do orçamento.';

    case 'DOWN_PAYMENT_AND_BALANCE':
      return downPaymentPercentage === null || downPaymentPercentage === undefined
        ? 'Defina a porcentagem da entrada. O saldo restante será cobrado após a conclusão do serviço.'
        : `Será cobrada uma entrada de ${downPaymentPercentage}% após a aprovação e o saldo restante após a conclusão do serviço.`;
  }
}

export function getQuoteDownPaymentAmountInCents(totalInCents: number, downPaymentPercentage: number | null): number {
  if (downPaymentPercentage === null) {
    return 0;
  }

  return Math.round((totalInCents * downPaymentPercentage) / 100);
}

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
