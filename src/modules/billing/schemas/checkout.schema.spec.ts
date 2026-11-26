import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkoutResponseSchema } from './checkout.schema';

describe('checkout response', () => {
  it('requires an attempt identity and usable client secret', () => {
    const data = { attemptId: '11111111-1111-4111-8111-111111111111', clientSecret: 'fixture-only' };

    assert.deepEqual(checkoutResponseSchema.parse({ statusCode: 200, success: true, data }), data);
    assert.equal(
      checkoutResponseSchema.safeParse({
        statusCode: 200,
        success: true,
        data: { ...data, clientSecret: '' },
      }).success,
      false,
    );
    assert.equal(
      checkoutResponseSchema.safeParse({
        statusCode: 200,
        success: true,
        data: { ...data, attemptId: 'bad' },
      }).success,
      false,
    );
  });
});
