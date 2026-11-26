import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatBrazilianPostalCode,
  formatBrazilianPostalCodeInput,
  normalizeBrazilianPostalCode,
} from './postalCode.formatter';

describe('Brazilian postal code formatters', () => {
  it('removes nonnumeric characters while preserving leading zeroes and the eight-digit limit', () => {
    assert.equal(normalizeBrazilianPostalCode('01234-567'), '01234567');
    assert.equal(normalizeBrazilianPostalCode('CEP 01234-56799'), '01234567');
    assert.equal(normalizeBrazilianPostalCode('letters'), '');
  });

  it('adds the separator only after five digits and supports partial edits', () => {
    assert.equal(formatBrazilianPostalCodeInput('01234'), '01234');
    assert.equal(formatBrazilianPostalCodeInput('012345'), '01234-5');
    assert.equal(formatBrazilianPostalCodeInput('01234567'), '01234-567');
  });

  it('handles absent display values without returning placeholder digits', () => {
    assert.equal(formatBrazilianPostalCode(null), '');
    assert.equal(formatBrazilianPostalCode(undefined), '');
    assert.equal(formatBrazilianPostalCode(''), '');
    assert.equal(formatBrazilianPostalCode('01234567'), '01234-567');
  });
});
