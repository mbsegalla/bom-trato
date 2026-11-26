import type { Customer } from '@/modules/customers/types/customer.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';
import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';

import { canRecordReceivablePayment, getReceivableKindLabel } from '../constants/receivable.constants';
import type { Receivable } from '../types/receivable.types';

export function canPrepareReceivableCharge(receivable: Receivable): boolean {
  return (
    canRecordReceivablePayment(receivable.status) &&
    receivable.currency === 'brl' &&
    Number.isSafeInteger(receivable.balanceInCents) &&
    receivable.balanceInCents > 0 &&
    Number.isFinite(receivable.dueAt.getTime())
  );
}

export function createReceivableChargeMessage(
  receivable: Receivable,
  customer: Customer,
  organizationName: string,
): { message: string; url: string } {
  if (!canPrepareReceivableCharge(receivable)) {
    throw new Error('Este recebível não possui saldo disponível para cobrança.');
  }

  if (
    customer.id !== receivable.customerId ||
    customer.organizationId !== receivable.organizationId ||
    customer.archivedAt !== null ||
    !isValidBrazilianPhone(customer.phone)
  ) {
    throw new Error('Confira o cadastro e o telefone do cliente antes de preparar a cobrança.');
  }

  const firstName = customer.name.trim().split(/\s+/)[0];
  const message = [
    firstName ? `Olá, ${firstName}!` : 'Olá!',
    '',
    'Segue um lembrete sobre o pagamento do serviço:',
    '',
    receivable.title,
    getReceivableKindLabel(receivable.kind),
    `Valor em aberto: ${formatBrlCurrency(receivable.balanceInCents)}`,
    `Vencimento: ${formatDate(receivable.dueAt)}`,
    '',
    'Caso já tenha efetuado o pagamento, por favor desconsidere este lembrete.',
    'Se precisar combinar a forma de pagamento, estamos à disposição.',
    '',
    organizationName.trim(),
  ].join('\n');

  const phone = normalizeBrazilianPhone(customer.phone);

  return {
    message,
    url: `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
  };
}
