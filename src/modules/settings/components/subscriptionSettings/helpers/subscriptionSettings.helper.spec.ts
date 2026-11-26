import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { findCurrentPlan } from './subscriptionSettings.helper';

const price: PlanPrice = { id: 'month', amountInCents: 1000, currency: 'brl', interval: 'MONTH', intervalCount: 1 };
const yearly: PlanPrice = { ...price, id: 'year', interval: 'YEAR', amountInCents: 10000 };
const first: Plan = {
  id: 'first',
  code: 'FIRST',
  name: 'First',
  description: 'Fixture plan',
  maxUsers: 1,
  teamManagementEnabled: false,
  prices: [price],
};
const second: Plan = {
  ...first, id: 'second', code: 'SECOND', name: 'Second', prices: [yearly],
};

describe('current subscription plan selection', () => {
  it('resolves the exact selected price and its owning plan across the catalog', () => {
    assert.deepEqual(findCurrentPlan([first, second], 'year'), { plan: second, price: yearly });
    assert.deepEqual(findCurrentPlan([first, second], 'month'), { plan: first, price });
  });

  it('does not substitute an unrelated plan or price when the identity is absent', () => {
    assert.equal(findCurrentPlan([first, second], 'unknown'), null);
    assert.equal(findCurrentPlan([], 'month'), null);
    assert.equal(findCurrentPlan([{ ...first, prices: [] }], 'month'), null);
  });
});
