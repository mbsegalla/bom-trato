import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPasswordRequirements, isPasswordValid } from './passwordPolicy';

describe('password policy', () => {
  it('enforces minimum and maximum length, uppercase and special characters', () => {
    assert.equal(isPasswordValid('A!' + 'a'.repeat(10)), true);
    assert.equal(isPasswordValid('A!' + 'a'.repeat(9)), false);
    assert.equal(isPasswordValid('A!' + 'a'.repeat(126)), true);
    assert.equal(isPasswordValid('A!' + 'a'.repeat(127)), false);
    assert.equal(isPasswordValid('lowercase!123'), false);
    assert.equal(isPasswordValid('Uppercase1234'), false);
  });

  it('counts Unicode code points and accepts Unicode uppercase and symbols', () => {
    assert.equal(isPasswordValid('Á' + '😀'.repeat(11)), true);
    assert.equal(getPasswordRequirements('A!').filter((rule) => rule.isSatisfied).length, 2);
  });
});
