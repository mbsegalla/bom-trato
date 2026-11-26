import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseQuantity } from './quantity.parser';

describe('quantity parser', () => {
  it('normalizes comma decimals and permits the thousandth boundary', () => {
    assert.equal(parseQuantity(' 1,125 '), '1.125');
    assert.equal(parseQuantity('0.001'), '0.001');
  });
  for (const input of ['0', '-1', '0.0001', '1e3', '1000000', '1,2,3', '']) {
    it('rejects invalid quantity ' + input, () => assert.equal(parseQuantity(input), null));
  }
});
