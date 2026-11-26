import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { installBrowserStorage } from '../../../../test/support/browserStorage.fixture';
import { getStoredThemePreference, storeThemePreference, THEME_STORAGE_KEY } from './theme.storage';

describe('theme storage', () => {
  it('uses the system preference during server rendering', () => {
    assert.equal(getStoredThemePreference(), 'system');
    assert.doesNotThrow(() => storeThemePreference('dark'));
  });
  it('persists supported themes and ignores unexpected storage values', (t) => {
    const browser = installBrowserStorage(t);
    storeThemePreference('dark');
    assert.equal(browser.localStorage.getItem(THEME_STORAGE_KEY), 'dark');
    assert.equal(getStoredThemePreference(), 'dark');
    browser.localStorage.setItem(THEME_STORAGE_KEY, 'unknown');
    assert.equal(getStoredThemePreference(), 'system');
  });
  it('falls back safely when browser storage is unavailable', (t) => {
    const browser = installBrowserStorage(t);
    t.mock.method(browser.localStorage, 'getItem', () => { throw new Error('Storage blocked'); });
    t.mock.method(browser.localStorage, 'setItem', () => { throw new Error('Storage blocked'); });
    assert.equal(getStoredThemePreference(), 'system');
    assert.doesNotThrow(() => storeThemePreference('light'));
  });
});
