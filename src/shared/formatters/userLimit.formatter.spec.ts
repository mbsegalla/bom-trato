import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatUserUsage, hasUnlimitedUsers } from './userLimit.formatter';

describe('team usage and plan limit formatting', () => {
  it('keeps the exact boundary between limited and unlimited plans', () => {
    assert.equal(hasUnlimitedUsers(1), false);
    assert.equal(hasUnlimitedUsers(999), false);
    assert.equal(hasUnlimitedUsers(1000), true);
  });

  it('displays finite capacity even when it is exhausted', () => {
    assert.equal(formatUserUsage(0, 5), '0 de 5 usuários');
    assert.equal(formatUserUsage(5, 5), '5 de 5 usuários');
  });

  it('uses singular and grouped plural counts for unlimited plans', () => {
    assert.equal(formatUserUsage(1, 1000), '1 usuário na equipe');
    assert.equal(formatUserUsage(1200, 2000), '1.200 usuários na equipe');
  });
});
