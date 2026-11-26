import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseBrlCurrencyToCents } from './currency.parser';

describe('BRL currency parser', () => {
  for (const [input, expected] of [
    ['R$ 1.234,56', 123456],
    ['0,01', 1],
    ['1.234', 123400],
    ['1.23', 123],
    ['0', 0]
  ] as const) {
    it('converts ' + input + ' to integer cents', () => assert.equal(parseBrlCurrencyToCents(input), expected));
  }
  for (const input of ['', '-1', '1e3', '1,234', '12,3,4', 'NaN', '9999999999999999999999']) {
    it('rejects invalid or unsafe amount ' + input, () => assert.equal(parseBrlCurrencyToCents(input), null));
  }
});
