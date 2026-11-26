import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatQuantity } from './quantity.formatter';

describe('service quantity formatting', () => {
  it('interprets integer thousandths without confusing the stored unit and displayed quantity', () => {
    assert.equal(formatQuantity(0), '0');
    assert.equal(formatQuantity(1), '0,001');
    assert.equal(formatQuantity(1250), '1,25');
    assert.equal(formatQuantity(1000), '1');
  });

  it('preserves precision and Brazilian grouping for large quantities', () => {
    assert.equal(formatQuantity(1234567), '1.234,567');
    assert.equal(formatQuantity(1000000), '1.000');
  });
});
