import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readRetryAfterSeconds } from './requestCooldown';

describe('Retry-After handling', () => {
  it('honors positive seconds and HTTP dates', (t) => {
    t.mock.method(Date, 'now', () => Date.parse('2026-01-01T00:00:00Z'));
    assert.equal(readRetryAfterSeconds(new Response(null, { headers: { 'Retry-After': '120' } })), 120);
    assert.equal(readRetryAfterSeconds(new Response(null, { headers: { 'Retry-After': 'Thu, 01 Jan 2026 00:01:30 GMT' } })), 90);
  });
  it('uses a safe fallback for absent, invalid or past values', () => {
    for (const header of [undefined, '0', '-1', 'invalid', 'Wed, 01 Jan 2020 00:00:00 GMT']) {
      assert.equal(readRetryAfterSeconds(new Response(null, { headers: header === undefined ? {} : { 'Retry-After': header } }), 180), 180);
    }
  });
});
