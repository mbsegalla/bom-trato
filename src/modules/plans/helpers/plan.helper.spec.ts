import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plan } from '../types/plan.types';
import { findSelectedPlan, getPlanUserLimitLabel } from './plan.helper';

const plan: Plan = {
  id: 'plan',
  code: 'fixture',
  name: 'Fixture',
  description: 'Fixture',
  maxUsers: 1,
  teamManagementEnabled: false,
  prices: [
    {
      id: 'price',
      interval: 'MONTH',
      intervalCount: 1,
      amountInCents: 1000,
      currency: 'brl',
    },
  ],
};

describe('plan selection', () => {
  it('selects only an actual price identity, never a plan id', () => {
    assert.deepEqual(findSelectedPlan([plan], 'price'), { plan, price: plan.prices[0] });
    assert.equal(findSelectedPlan([plan], 'plan'), null);
    assert.equal(findSelectedPlan([], 'price'), null);
  });

  it('labels single, limited and unlimited membership accurately', () => {
    assert.equal(getPlanUserLimitLabel(plan), 'Até 1 usuário');
    assert.equal(getPlanUserLimitLabel({ ...plan, maxUsers: 10 }), 'Até 10 usuários');
    assert.equal(getPlanUserLimitLabel({ ...plan, maxUsers: 1000 }), 'Usuários ilimitados');
  });
});
