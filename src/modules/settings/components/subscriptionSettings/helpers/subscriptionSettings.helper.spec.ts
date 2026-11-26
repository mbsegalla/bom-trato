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
  ...first,
  id: 'second',
  code: 'SECOND',
  name: 'Second',
  prices: [yearly],
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

describe('current subscription plan catalog edge cases', () => {
  it('skips empty plans and matches a later price within a multi-price plan', () => {
    const empty = { ...first, prices: [] };
    const multi = { ...second, prices: [price, yearly] };

    assert.deepEqual(findCurrentPlan([empty, multi], 'year'), { plan: multi, price: yearly });
  });

  it('does not confuse the plan identifier with a price identifier', () => {
    assert.equal(findCurrentPlan([first, second], first.id), null);
    assert.equal(findCurrentPlan([first, second], second.id), null);
  });

  it('requires exact case-sensitive price identity', () => {
    assert.equal(findCurrentPlan([first, second], 'YEAR'), null);
    assert.equal(findCurrentPlan([first, second], ' year '), null);
  });

  it('returns the original catalog references without modifying the catalog', () => {
    const plans = [first, second];
    const before = JSON.stringify(plans);
    const result = findCurrentPlan(plans, 'year');

    assert.equal(result?.plan, second);
    assert.equal(result?.price, yearly);
    assert.equal(JSON.stringify(plans), before);
  });
});
