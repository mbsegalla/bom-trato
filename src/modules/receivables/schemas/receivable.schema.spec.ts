import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createReceivableFormSchema,
  receivablePaymentFormSchema,
  receivableCancelFormSchema
} from './receivable.schema';

describe('receivable forms', () => {
  it('validates calendar dates and keeps the local due date at end of day', () => {
    const value = createReceivableFormSchema.parse({ dueAt: '2028-02-29', notes: '' });
    const date = new Date(value.dueAt);

    assert.equal(date.getDate(), 29);
    assert.equal(date.getMonth(), 1);
    assert.equal(date.getHours(), 23);
    assert.equal(value.notes, null);
    assert.equal(createReceivableFormSchema.safeParse({ dueAt: '2027-02-29', notes: '' }).success, false);
  });

  it('rejects future payments, zero amounts, invalid methods and missing cancellation reason', () => {
    const input = {
      amountInCents: '100,01',
      receivedAt: '2020-01-01T00:00:00Z',
      method: 'PIX',
      notes: ''
    };

    assert.equal(receivablePaymentFormSchema.parse(input).amountInCents, 10001);

    for (const patch of [
      { receivedAt: '2999-01-01T00:00:00Z' },
      { amountInCents: '0' },
      { amountInCents: '-1' },
      { method: 'UNKNOWN' }
    ]) assert.equal(receivablePaymentFormSchema.safeParse({ ...input, ...patch }).success, false);

    assert.equal(receivableCancelFormSchema.safeParse({ reason: '  ' }).success, false);
  });
});
