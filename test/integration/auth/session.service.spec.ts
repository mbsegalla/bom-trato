import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { authenticatedFetch, restoreSession, SessionError } from '@/modules/auth/services/session.service';

import { mockHttp, sessionResponse, success } from '../../support/http.fixture';

describe('authenticated HTTP session', () => {
  it('shares one refresh flight across concurrent callers and includes CSRF and cookies', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'pre-refresh-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      throw new Error('Unexpected request: ' + call.path);
    });

    const results = await Promise.all([restoreSession(), restoreSession(), restoreSession()]);

    assert.equal(results[0].accessToken, 'fixture-access');
    assert.strictEqual(results[0], results[1]);
    assert.deepEqual(
      calls.map((call) => call.path),
      ['/api/auth/csrf', '/api/auth/refresh'],
    );
    assert.equal(calls[1].headers.get('X-CSRF-Token'), 'pre-refresh-csrf');
    assert.equal(calls[1].credentials, 'include');
    assert.equal(calls[1].cache, 'no-store');
  });

  it('renews a rejected session and retries the original authenticated request only once', async (t) => {
    let refreshes = 0;
    let protectedCalls = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'pre-refresh-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse('access-' + ++refreshes);
      if (call.path === '/api/protected') {
        protectedCalls++;

        return new Response(null, { status: 401 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    const result = await authenticatedFetch('/api/protected', { method: 'GET', headers: { 'X-Trace': 'fixture' } });

    assert.equal(result.status, 401);
    assert.equal(refreshes, 2);
    assert.equal(protectedCalls, 2);

    const protectedRequests = calls.filter((call) => call.path === '/api/protected');

    assert.deepEqual(
      protectedRequests.map((call) => call.headers.get('Authorization')),
      ['Bearer access-1', 'Bearer access-2'],
    );
    for (const request of protectedRequests) {
      assert.equal(request.headers.get('X-CSRF-Token'), 'fixture-csrf');
      assert.equal(request.headers.get('X-Trace'), 'fixture');
      assert.equal(request.credentials, 'include');
    }
  });

  it('preserves the retry-after duration when session refresh is rate limited', async (t) => {
    const calls = mockHttp(t, (call) =>
      call.path === '/api/auth/csrf'
        ? success({ csrfToken: 'fixture-csrf' })
        : new Response(null, { status: 429, headers: { 'Retry-After': '75' } }),
    );

    await assert.rejects(
      restoreSession(),
      (error: unknown) =>
        error instanceof SessionError &&
        error.status === 429 &&
        error.retryAfterSeconds === 75 &&
        !error.uncertain,
    );
    assert.equal(calls.length, 2);
  });

  it('preserves rate limits from CSRF without attempting refresh', async (t) => {
    const calls = mockHttp(t, () => new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));

    await assert.rejects(
      restoreSession(),
      (error: unknown) =>
        error instanceof SessionError && error.status === 429 && error.retryAfterSeconds === 120,
    );
    assert.equal(calls.length, 1);
  });

  it('does not accept malformed session data', async (t) => {
    mockHttp(t, (call) =>
      call.path === '/api/auth/csrf' ? success({ csrfToken: 'fixture-csrf' }) : success({ accessToken: 'incomplete' }),
    );

    await assert.rejects(restoreSession(), (error: unknown) => error instanceof SessionError && error.uncertain);
  });
});
