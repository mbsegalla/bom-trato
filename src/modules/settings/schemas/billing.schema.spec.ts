import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { billingCardSchema, billingReturnParamsSchema } from './billing.schema';

describe('billing contracts', () => {
  it('exposes only masked card fields and validates expiry month', () => {
    const data = {
      brand: 'visa',
      last4: '1234',
      expMonth: 12,
      expYear: 2028
    };

    assert.deepEqual(billingCardSchema.parse({ ...data, fullNumber: 'private', cvc: 'private' }), data);
    assert.equal(billingCardSchema.safeParse({ ...data, last4: '12345' }).success, false);
    assert.equal(billingCardSchema.safeParse({ ...data, expMonth: 13 }).success, false);
  });

  it('requires a valid operation scope on return', () => {
    const data = {
      organizationId: '11111111-1111-4111-8111-111111111111',
      operationId: '22222222-2222-4222-8222-222222222222',
      kind: 'plan-change'
    };

    assert.equal(billingReturnParamsSchema.safeParse(data).success, true);
    assert.equal(billingReturnParamsSchema.safeParse({ ...data, kind: 'unknown' }).success, false);
    assert.equal(billingReturnParamsSchema.safeParse({ ...data, organizationId: 'invalid' }).success, false);
  });
});
