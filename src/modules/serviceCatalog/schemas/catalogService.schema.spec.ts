import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { catalogServiceFormSchema } from './catalogService.schema';

const input = { name: ' Revisao ', description: '', unit: 'SERVICE', amountInCents: 'R$ 123,45', estimatedDurationMinutes: '60' };
describe('catalog service form', () => {
  it('converts prices to cents and duration to integer minutes', () => {
    assert.deepEqual(catalogServiceFormSchema.parse(input), { name: 'Revisao', description: null, unit: 'SERVICE', amountInCents: 12345, estimatedDurationMinutes: 60 });
    assert.equal(catalogServiceFormSchema.parse({ ...input, amountInCents: '0', estimatedDurationMinutes: '' }).estimatedDurationMinutes, null);
  });
  it('rejects overflow, negative prices, invalid duration and units', () => {
    for (const patch of [{ amountInCents: '21474836,48' }, { amountInCents: '-1' }, { estimatedDurationMinutes: '0' }, { estimatedDurationMinutes: '1.5' }, { unit: 'UNKNOWN' }]) assert.equal(catalogServiceFormSchema.safeParse({ ...input, ...patch }).success, false);
  });
});
