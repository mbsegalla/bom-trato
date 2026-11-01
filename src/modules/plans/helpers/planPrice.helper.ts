import type { Plan, PlanPrice, PricingInterval } from '../types/plan.types';

export function getPlanPriceByInterval(plan: Plan, interval: PricingInterval): PlanPrice | undefined {
  return (
    plan.prices.find((price) => price.interval === interval && price.intervalCount === 1) ??
    plan.prices.find((price) => price.interval === interval)
  );
}

export function getMonthlyEquivalentAmount(price: PlanPrice): number | null {
  if (price.interval !== 'YEAR') {
    return null;
  }

  return Math.round(price.amountInCents / (12 * price.intervalCount));
}

export function getAnnualSavingsPercentage(plan: Plan): number | null {
  const monthly = getPlanPriceByInterval(plan, 'MONTH');
  const yearly = getPlanPriceByInterval(plan, 'YEAR');

  if (!monthly || !yearly || monthly.intervalCount !== 1 || yearly.intervalCount !== 1 || monthly.amountInCents <= 0) {
    return null;
  }

  const monthlyYearTotal = monthly.amountInCents * 12;

  if (yearly.amountInCents >= monthlyYearTotal) {
    return null;
  }

  return Math.round(((monthlyYearTotal - yearly.amountInCents) / monthlyYearTotal) * 100);
}

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
