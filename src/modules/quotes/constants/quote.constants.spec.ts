import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getQuoteDownPaymentAmountInCents, isQuoteExpired } from './quote.constants';

describe('quote presentation rules', () => {
  it('rounds down payments in cents and does not infer an unspecified percentage', () => {
    assert.equal(getQuoteDownPaymentAmountInCents(1001, 50), 501);
    assert.equal(getQuoteDownPaymentAmountInCents(1001, null), 0);
  });
  it('only considers sent quotes expired', (t) => {
    const now = new Date('2026-01-01T00:00:00Z');
    t.mock.method(Date, 'now', () => now.getTime());
    assert.equal(isQuoteExpired('SENT', now), true);
    assert.equal(isQuoteExpired('APPROVED', now), false);
    assert.equal(isQuoteExpired('SENT', null), false);
  });
});
