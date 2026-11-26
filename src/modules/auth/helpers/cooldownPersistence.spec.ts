import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { installBrowserStorage } from '../../../../test/support/browserStorage.fixture';
import {
  getPasswordResetCooldownSeconds,
  startPasswordResetCooldown,
  subscribeToPasswordResetCooldown,
} from './passwordResetCooldown';
import { getVerificationCooldownSeconds, startVerificationCooldown } from './verificationCooldown';

describe('request cooldown persistence', () => {
  it('isolates scopes, preserves a longer cooldown, notifies listeners and cleans up subscriptions', (t) => {
    const browser = installBrowserStorage(t);
    let now = Date.now();
    t.mock.method(Date, 'now', () => now);
    let changes = 0;
    const unsubscribe = subscribeToPasswordResetCooldown(() => {
      changes += 1;
    });
    try {
      assert.equal(getPasswordResetCooldownSeconds(), 0);
      startPasswordResetCooldown(60);
      assert.equal(getPasswordResetCooldownSeconds(), 60);
      assert.equal(changes, 1);
      startPasswordResetCooldown(5);
      assert.equal(getPasswordResetCooldownSeconds(), 60);
      startVerificationCooldown(120);
      assert.equal(changes, 2);
      assert.equal(getVerificationCooldownSeconds(), 120);
      now += 30_001;
      assert.equal(getPasswordResetCooldownSeconds(), 30);
      assert.equal(getVerificationCooldownSeconds(), 90);
      browser.dispatchEvent(new Event('focus'));
      assert.equal(changes, 3);
      now += 90_000;
      assert.equal(getPasswordResetCooldownSeconds(), 0);
      assert.equal(getVerificationCooldownSeconds(), 0);
    } finally {
      unsubscribe();
    }
    browser.dispatchEvent(new Event('focus'));

    assert.equal(changes, 3);
  });
});
