import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { businessProfileFormSchema } from '@/modules/settings/schemas/business.schema';

const base = {
  name: 'Fixture company', email: null, phone: null, documentType: null, document: null,
  addressLine1: null, addressLine2: null, city: null, state: null, postalCode: null, defaultReceivableDueDays: 7,
};

describe('business profile form normalization', () => {
  it('normalizes whitespace, contact details, CPF and postal code before submission', () => {
    const result = businessProfileFormSchema.parse({
      ...base, name: '  Fixture company ', email: ' fixture@example.com ', phone: ' (34) 99999-9999 ',
      documentType: 'CPF', document: '191.191.191-00', addressLine1: ' Street ', addressLine2: ' ',
      city: ' Uberlandia ', state: ' mg ', postalCode: '38400-000', defaultReceivableDueDays: '0',
    });
    assert.equal(result.name, 'Fixture company');
    assert.equal(result.email, 'fixture@example.com');
    assert.equal(result.document, '19119119100');
    assert.equal(result.postalCode, '38400000');
    assert.equal(result.state, 'MG');
    assert.equal(result.addressLine2, null);
    assert.equal(result.defaultReceivableDueDays, 0);
  });

  it('clears blank nullable fields and accepts the maximum due period', () => {
    const result = businessProfileFormSchema.parse({
      ...base, email: ' ', phone: ' ', documentType: '', document: '', state: ' ', postalCode: '', defaultReceivableDueDays: '365',
    });
    assert.deepEqual(result, { ...base, defaultReceivableDueDays: 365 });
  });

  for (const [label, patch] of [
    ['missing document', { documentType: 'CPF' }],
    ['missing document type', { document: '19119119100' }],
    ['short CPF', { documentType: 'CPF', document: '123' }],
    ['short CNPJ', { documentType: 'CNPJ', document: '123' }],
    ['nonstring email', { email: 42 }],
    ['nonstring phone', { phone: 42 }],
    ['nonstring document', { document: 42 }],
    ['nonstring state', { state: 42 }],
    ['nonstring postal code', { postalCode: 42 }],
    ['invalid state', { state: 'MINAS' }],
    ['invalid postal code', { postalCode: '123' }],
    ['negative due period', { defaultReceivableDueDays: -1 }],
    ['long due period', { defaultReceivableDueDays: 366 }],
    ['fractional due period', { defaultReceivableDueDays: 1.5 }],
  ] as const) {
    it('rejects ' + label, () => {
      assert.equal(businessProfileFormSchema.safeParse({ ...base, ...patch }).success, false);
    });
  }

  it('accepts a formatted CNPJ and preserves the normalized digits', () => {
    assert.equal(businessProfileFormSchema.parse({ ...base, documentType: 'CNPJ', document: '12.345.678/0001-99' }).document, '12345678000199');
  });
});
