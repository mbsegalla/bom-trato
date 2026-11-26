import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { planPriceSchema } from './plan.schema';

describe('plan pricing contract', () => {
  it('requires integer BRL prices and a valid recurring interval', () => {
    const input = {
      id: '11111111-1111-4111-8111-111111111111',
      amountInCents: 4990,
      currency: 'brl',
      interval: 'MONTH',
      intervalCount: 1
    };

    assert.deepEqual(planPriceSchema.parse(input), input);

    for (const patch of [
      { amountInCents: -1 },
      { amountInCents: 1.5 },
      { currency: 'usd' },
      { interval: 'DAY' },
      { intervalCount: 0 }
    ]) assert.equal(planPriceSchema.safeParse({ ...input, ...patch }).success, false);
  });
});
