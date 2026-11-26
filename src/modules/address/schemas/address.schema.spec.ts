import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addressLookupSchema } from './address.schema';

describe('address lookup contract', () => {
  it('requires normalized CEP, state and city while allowing absent street', () => {
    const input = {
      postalCode: '01001000',
      street: null,
      neighborhood: null,
      city: 'Sao Paulo',
      state: 'SP',
      cityIbgeCode: null,
      stateIbgeCode: null
    };

    assert.deepEqual(addressLookupSchema.parse(input), input);

    for (const patch of [
      { postalCode: '01001-000' },
      { city: '' },
      { state: 'sp' }
    ]) assert.equal(addressLookupSchema.safeParse({ ...input, ...patch }).success, false);
  });
});
