import type { BillingInvoice, PlanChangeMode, PlanChangeStatus, SubscriptionStatus } from '../types/billing.types';

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Ativa';

    case 'TRIALING':
      return 'Período de teste';

    case 'PAST_DUE':
      return 'Pagamento pendente';

    case 'UNPAID':
      return 'Não paga';

    case 'PAUSED':
      return 'Pausada';

    case 'CANCELED':
      return 'Cancelada';

    case 'INCOMPLETE':
      return 'Pagamento incompleto';

    case 'INCOMPLETE_EXPIRED':
      return 'Expirada';
  }
}

export function getPlanChangeModeLabel(mode: PlanChangeMode): string {
  return mode === 'IMMEDIATE' ? 'Alteração imediata' : 'Alteração no próximo ciclo';
}

export function getPlanChangeStatusLabel(status: PlanChangeStatus): string {
  switch (status) {
    case 'QUOTED':
      return 'Aguardando confirmação';

    case 'PROCESSING':
      return 'Processando';

    case 'PENDING_PAYMENT':
      return 'Aguardando pagamento';

    case 'SCHEDULED':
      return 'Agendada';

    case 'APPLIED':
      return 'Aplicada';

    case 'CANCELED':
      return 'Cancelada';

    case 'EXPIRED':
      return 'Expirada';
  }
}

export function getInvoiceStatusLabel(invoice: BillingInvoice): string {
  switch (invoice.status.toLowerCase()) {
    case 'paid':
      return 'Pago';

    case 'open':
      return 'Em aberto';

    case 'draft':
      return 'Rascunho';

    case 'void':
      return 'Cancelada';

    case 'uncollectible':
      return 'Não recebida';

    default:
      return invoice.status;
  }
}

export function getCardBrandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case 'visa':
      return 'Visa';

    case 'mastercard':
      return 'Mastercard';

    case 'amex':
      return 'American Express';

    case 'discover':
      return 'Discover';

    case 'elo':
      return 'Elo';

    case 'hipercard':
      return 'Hipercard';

    default:
      return brand;
  }
}

export function getBillingIntervalLabel(interval: 'MONTH' | 'YEAR'): string {
  return interval === 'YEAR' ? 'ano' : 'mês';
}
