import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatBusinessDocument, formatBusinessDocumentInput } from './businessProfileFormatters';

describe('business document formatting', () => {
  it('formats CPF and CNPJ incrementally and strips non-digit input', () => {
    assert.equal(formatBusinessDocumentInput('CPF', '12345678901'), '123.456.789-01');
    assert.equal(formatBusinessDocumentInput('CPF', 'abc123456'), '123.456');
    assert.equal(formatBusinessDocumentInput('CNPJ', '12345678000199'), '12.345.678/0001-99');
    assert.equal(formatBusinessDocumentInput('CNPJ', '12345678000199999'), '12.345.678/0001-99');
  });

  it('does not display documents without an explicit type or value', () => {
    assert.equal(formatBusinessDocument(null, '12345678901'), '');
    assert.equal(formatBusinessDocument('CPF', null), '');
    assert.equal(formatBusinessDocumentInput('', '123'), '');
  });
});
