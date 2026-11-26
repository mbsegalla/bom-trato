import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requestPasswordReset, resetPassword } from '@/modules/auth/services/passwordReset.service';
import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(43);
const password = 'Fixture!password123';

describe('password recovery HTTP service', () => {
  it('rejects malformed email and reset tokens before network access', async (t) => {
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });
    assert.equal((await requestPasswordReset('invalid')).success, false);
    const result = await resetPassword('bad', password);
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.invalidToken, true);
    assert.equal(calls.length, 0);
  });

  it('requests recovery with a trimmed email and fresh CSRF token', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/forgot-password') return new Response(null, { status: 204 });
      throw new Error('Unexpected request');
    });
    assert.deepEqual(await requestPasswordReset(' fixture@example.invalid '), { success: true });
    assert.deepEqual(JSON.parse(String(calls[1].body)), { email: 'fixture@example.invalid' });
    assert.equal(calls[1].headers.get('X-CSRF-Token'), 'fixture-csrf');
    assert.equal(calls[1].credentials, 'include');
  });

  it('distinguishes expired or used reset tokens from rate limiting and never retries the mutation', async (t) => {
    let status = 401;
    const calls = mockHttp(t, (call) => call.path === '/api/auth/csrf'
      ? success({ csrfToken: 'fixture-csrf' })
      : new Response(null, { status }));
    const invalid = await resetPassword(token, password);
    assert.equal(invalid.success, false);
    if (!invalid.success) assert.equal(invalid.invalidToken, true);
    status = 429;
    const limited = await resetPassword(token, password);
    assert.equal(limited.success, false);
    if (!limited.success) assert.equal(limited.rateLimited, true);
    const posts = calls.filter((call) => call.path === '/api/auth/reset-password');
    assert.equal(posts.length, 2);
    for (const call of posts) {
      assert.deepEqual(JSON.parse(String(call.body)), { token, password });
      assert.equal(call.method, 'POST');
    }
  });
});
