import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getAuthIdentityProviders, linkGoogleIdentity } from '@/modules/auth/services/authIdentity.service';
import { restoreSession } from '@/modules/auth/services/session.service';

import { mockHttp, sessionResponse, success } from '../../support/http.fixture';

describe('auth identity HTTP boundary', () => {
  it('only accepts known provider identities and sends the linking credential in a POST body', async (t) => {
    let providers = ['GOOGLE'];
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/auth/identities') return success({ providers });

      return new Response(null, { status: 409 });
    });

    await restoreSession();

    assert.deepEqual(await getAuthIdentityProviders(), ['GOOGLE']);

    providers = ['UNKNOWN'];

    await assert.rejects(getAuthIdentityProviders(), /interpretar/);
    await assert.rejects(linkGoogleIdentity('fixture-credential'), /vincular/);

    const post = calls.at(-1)!;

    assert.equal(post.path, '/api/auth/google/link');
    assert.equal(post.method, 'POST');
    assert.deepEqual(JSON.parse(String(post.body)), { credential: 'fixture-credential' });
  });
  it('rejects identity reads after a forbidden response and permits an explicit retry', async (t) => {
    let failed = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return failed ? new Response(null, { status: 403 }) : success({ providers: ['GOOGLE'] });
    });
    await restoreSession();
    await assert.rejects(getAuthIdentityProviders(), /consultar os métodos de acesso/);
    failed = false;
    assert.deepEqual(await getAuthIdentityProviders(), ['GOOGLE']);
    assert.equal(calls.filter((call) => call.path === '/api/auth/identities').length, 2);
  });

  for (const [status, message] of [
    [401, /sessão expirou/],
    [503, /conectar sua conta Google/],
  ] as const) {
    it('reports linking failure ' + status + ' and limits unauthorized replay', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(linkGoogleIdentity('fixture-credential'), message);
      assert.equal(calls.filter((call) => call.path === '/api/auth/google/link').length, status === 401 ? 2 : 1);
    });
  }

  it('accepts a successful link without reading a nonexistent JSON response body', async (t) => {
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 204 });
    });
    await restoreSession();
    await linkGoogleIdentity('fixture-credential');
  });
});
