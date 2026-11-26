import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mercadoPagoCompletionSchema } from './mercadoPagoConnection.schema';

describe('Mercado Pago OAuth completion contract', () => {
  it('accepts a scoped account and rejects invalid account identity', () => {
    const input = {
      organizationId: '11111111-1111-4111-8111-111111111111',
      organizationName: 'Empresa',
      accountId: '123456',
      liveMode: false
    };

    assert.deepEqual(mercadoPagoCompletionSchema.parse({ ...input, accessToken: 'hidden' }), input);

    for (const accountId of ['0', 'abc', '-1', '1'.repeat(31)]) assert.equal(mercadoPagoCompletionSchema.safeParse({ ...input, accountId }).success, false);
  });
});
