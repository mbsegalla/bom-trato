import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getAuthIdentityProviders, linkGoogleIdentity } from '@/modules/auth/services/authIdentity.service';
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
});
