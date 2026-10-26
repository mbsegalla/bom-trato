import type { PlanPrice } from '../types/plan.types';

export function getPricePeriodLabel(price: PlanPrice): string {
  if (price.interval === 'MONTH' && price.intervalCount === 1) {
    return '/ mês';
  }

  if (price.interval === 'YEAR' && price.intervalCount === 1) {
    return '/ ano';
  }

  if (price.interval === 'MONTH') {
    return `/ ${price.intervalCount} meses`;
  }

  return `/ ${price.intervalCount} anos`;
}

export function getRecurringBillingLabel(price: PlanPrice): string {
  if (price.interval === 'MONTH' && price.intervalCount === 1) {
    return 'Cobrança recorrente mensal. Você pode cancelar a renovação quando quiser.';
  }

  if (price.interval === 'YEAR' && price.intervalCount === 1) {
    return 'Cobrança recorrente anual. Você pode cancelar a renovação quando quiser.';
  }

  if (price.interval === 'MONTH') {
    return `Cobrança recorrente a cada ${price.intervalCount} meses. Você pode cancelar a renovação quando quiser.`;
  }

  return `Cobrança recorrente a cada ${price.intervalCount} anos. Você pode cancelar a renovação quando quiser.`;
}
