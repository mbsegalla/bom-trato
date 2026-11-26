import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatBrazilianPhoneInput, isValidBrazilianPhone, normalizeBrazilianPhone } from './phone.formatter';

describe('Brazilian phone formatting', () => {
  it('normalizes country code and formats mobile and landline separately', () => {
    assert.equal(normalizeBrazilianPhone('+55 (34) 99999-1234'), '34999991234');
    assert.equal(formatBrazilianPhoneInput('34999991234'), '(34) 99999-1234');
    assert.equal(formatBrazilianPhoneInput('3432221234'), '(34) 3222-1234');
  });
  for (const input of ['123', '00999991234', '34899991234', '3412221234', '34abc999991234']) {
    it('rejects invalid phone ' + input, () => assert.equal(isValidBrazilianPhone(input), false));
  }

  it('accepts valid mobile and landline formats', () => {
    assert.equal(isValidBrazilianPhone('+55 (34) 99999-1234'), true);
    assert.equal(isValidBrazilianPhone('(34) 3222-1234'), true);
  });
});
