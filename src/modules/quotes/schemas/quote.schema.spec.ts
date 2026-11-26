import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createQuoteFormSchema, customQuoteItemFormSchema, publicQuoteChangeRequestFormSchema, quoteShareTokenSchema } from './quote.schema';

const input = { customerId: '11111111-1111-4111-8111-111111111111', title: ' Revisao ', notes: '', validUntil: '', paymentCondition: 'DOWN_PAYMENT_AND_BALANCE', downPaymentPercentage: '25' };
describe('quote forms', () => {
  it('requires a valid percentage for down payment and normalizes optional dates and notes', () => {
    assert.deepEqual(createQuoteFormSchema.parse(input), { ...input, title: 'Revisao', notes: null, validUntil: null, downPaymentPercentage: 25 });
    for (const downPaymentPercentage of ['', '0', '100', '1.5']) assert.equal(createQuoteFormSchema.safeParse({ ...input, downPaymentPercentage }).success, false);
  });
  it('rejects an expired validity and transforms item quantity and amount', () => {
    assert.equal(createQuoteFormSchema.safeParse({ ...input, validUntil: '2000-01-01' }).success, false);
    assert.deepEqual(customQuoteItemFormSchema.parse({ name: 'Servico', description: '', unit: 'SERVICE', quantity: '1,125', unitAmountInCents: '10,01' }),
      { name: 'Servico', description: null, unit: 'SERVICE', quantity: '1.125', unitAmountInCents: 1001 });
  });
  it('requires a private token and meaningful change request', () => {
    assert.equal(quoteShareTokenSchema.safeParse('a'.repeat(64)).success, true);
    assert.equal(quoteShareTokenSchema.safeParse('not-a-token').success, false);
    assert.equal(publicQuoteChangeRequestFormSchema.safeParse({ message: 'abc' }).success, false);
    assert.equal(publicQuoteChangeRequestFormSchema.parse({ message: ' Alterar data ' }).message, 'Alterar data');
  });
});
