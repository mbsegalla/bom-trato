import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plan, PlanPrice } from '../types/plan.types';
import { getAnnualSavingsPercentage, getMonthlyEquivalentAmount, getPlanPriceByInterval, getPricePeriodLabel, getRecurringBillingLabel } from './planPrice.helper';

const monthly: PlanPrice = { id: 'monthly', interval: 'MONTH', intervalCount: 1, amountInCents: 1000, currency: 'brl' };
const yearly: PlanPrice = { ...monthly, id: 'yearly', interval: 'YEAR', amountInCents: 9999 };
const plan: Plan = { id: 'plan', code: 'fixture', name: 'Fixture', description: 'Fixture', maxUsers: 3, teamManagementEnabled: true, prices: [{ ...monthly, id: 'quarter', intervalCount: 3 }, monthly, yearly] };
describe('plan price presentation', () => {
  it('prefers a single billing interval and falls back only to the requested interval', () => {
    assert.equal(getPlanPriceByInterval(plan, 'MONTH'), monthly);
    assert.equal(getPlanPriceByInterval({ ...plan, prices: [yearly] }, 'MONTH'), undefined);
    assert.equal(getPlanPriceByInterval({ ...plan, prices: [plan.prices[0]!] }, 'MONTH')?.intervalCount, 3);
  });
  it('rounds the monthly equivalent in cents and reports genuine annual savings only', () => {
    assert.equal(getMonthlyEquivalentAmount(yearly), 833);
    assert.equal(getMonthlyEquivalentAmount(monthly), null);
    assert.equal(getAnnualSavingsPercentage(plan), 17);
    assert.equal(getAnnualSavingsPercentage({ ...plan, prices: [monthly, { ...yearly, amountInCents: 12000 }] }), null);
    assert.equal(getAnnualSavingsPercentage({ ...plan, prices: [{ ...monthly, amountInCents: 0 }, yearly] }), null);
  });
  it('describes the actual recurring interval', () => {
    assert.equal(getPricePeriodLabel(monthly), '/ mês');
    assert.equal(getPricePeriodLabel(yearly), '/ ano');
    assert.match(getRecurringBillingLabel({ ...yearly, intervalCount: 2 }), /a cada 2 anos/);
  });
});
