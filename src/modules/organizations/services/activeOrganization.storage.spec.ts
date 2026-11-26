import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { installBrowserStorage } from '../../../../test/support/browserStorage.fixture';
import { getStoredActiveOrganizationId, storeActiveOrganizationId } from './activeOrganization.storage';

describe('active organization storage', () => {
  it('does not read or write browser storage on the server', () => {
    assert.equal(getStoredActiveOrganizationId(), null);
    assert.doesNotThrow(() => storeActiveOrganizationId('first'));
  });

  it('remembers the last explicitly selected organization without mixing keys', (t) => {
    const browser = installBrowserStorage(t);

    assert.equal(getStoredActiveOrganizationId(), null);

    browser.localStorage.setItem('bom-trato:theme', 'light');
    storeActiveOrganizationId('first');
    storeActiveOrganizationId('second');

    assert.equal(getStoredActiveOrganizationId(), 'second');
    assert.equal(browser.localStorage.getItem('bom-trato:theme'), 'light');
  });
});
