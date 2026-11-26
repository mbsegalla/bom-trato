import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { businessProfileFormSchema } from './business.schema';

const input = {
  name: ' Fixture ',
  email: '',
  phone: '+55 (34) 99999-1234',
  documentType: 'CPF',
  document: '123.456.789-01',
  addressLine1: '',
  addressLine2: '',
  city: ' Uberlandia ',
  state: ' mg ',
  postalCode: '38400-000',
  defaultReceivableDueDays: '7',
};

describe('business profile form', () => {
  it('normalizes contact and address fields and converts due days to integer', () => {
    const parsed = businessProfileFormSchema.parse(input);

    assert.deepEqual(parsed, {
      ...input,
      name: 'Fixture',
      email: null,
      phone: '34999991234',
      document: '12345678901',
      addressLine1: null,
      addressLine2: null,
      city: 'Uberlandia',
      state: 'MG',
      postalCode: '38400000',
      defaultReceivableDueDays: 7,
    });
  });

  it('requires consistent document type and length, valid contact and bounded due days', () => {
    for (const patch of [
      { documentType: 'CNPJ' },
      { documentType: '' },
      { document: '' },
      { phone: '123' },
      { email: 'bad' },
      { postalCode: '123' },
      { defaultReceivableDueDays: '366' },
      { defaultReceivableDueDays: '1.5' },
    ]) {
      assert.equal(businessProfileFormSchema.safeParse({ ...input, ...patch }).success, false);
    }
  });
});
