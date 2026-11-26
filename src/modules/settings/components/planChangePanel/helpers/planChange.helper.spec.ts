import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';
import { findPlanPrice } from './planChange.helper';

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

describe('plan change target selection', () => {
  it('resolves the exact selected price and its owning plan across the catalog', () => {
    assert.deepEqual(findPlanPrice([first, second], 'year'), { plan: second, price: yearly });
    assert.deepEqual(findPlanPrice([first, second], 'month'), { plan: first, price });
  });

  it('does not substitute an unrelated plan or price when the identity is absent', () => {
    assert.equal(findPlanPrice([first, second], 'unknown'), null);
    assert.equal(findPlanPrice([], 'month'), null);
    assert.equal(findPlanPrice([{ ...first, prices: [] }], 'month'), null);
  });
});
