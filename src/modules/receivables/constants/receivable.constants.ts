import type { ReceivableListStatus, ReceivablePaymentMethod, ReceivableStatus } from '../types/receivable.types';

export const receivableStatusOptions: {
  value: ReceivableListStatus;
  label: string;
}[] = [
  {
    value: 'ALL',
    label: 'Todos',
  },
  {
    value: 'OPEN',
    label: 'Em aberto',
  },
  {
    value: 'PARTIALLY_PAID',
    label: 'Parciais',
  },
  {
    value: 'PAID',
    label: 'Pagos',
  },
  {
    value: 'CANCELED',
    label: 'Cancelados',
  },
];

export const receivablePaymentMethodOptions: {
  value: ReceivablePaymentMethod;
  label: string;
}[] = [
  {
    value: 'PIX',
    label: 'PIX',
  },
  {
    value: 'CASH',
    label: 'Dinheiro',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Transferência bancária',
  },
  {
    value: 'CREDIT_CARD',
    label: 'Cartão de crédito',
  },
  {
    value: 'DEBIT_CARD',
    label: 'Cartão de débito',
  },
  {
    value: 'OTHER',
    label: 'Outro',
  },
];

export function getReceivableStatusLabel(status: ReceivableStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Em aberto';

    case 'PARTIALLY_PAID':
      return 'Parcialmente pago';

    case 'PAID':
      return 'Pago';

    case 'CANCELED':
      return 'Cancelado';
  }
}

export function getReceivablePaymentMethodLabel(method: ReceivablePaymentMethod): string {
  return receivablePaymentMethodOptions.find((option) => option.value === method)?.label ?? method;
}

export function canEditReceivable(status: ReceivableStatus): boolean {
  return status === 'OPEN' || status === 'PARTIALLY_PAID';
}

export function canRecordReceivablePayment(status: ReceivableStatus): boolean {
  return status === 'OPEN' || status === 'PARTIALLY_PAID';
}
