import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { registerUser } from '@/modules/auth/services/auth.service';
import { mockHttp, success } from '../../support/http.fixture';

const input = {
  name: 'Fixture User',
  email: 'fixture@example.invalid',
  password: 'Fixture!password123',
  termsVersion: 'fixture-terms',
  privacyNoticeVersion: 'fixture-privacy',
};

describe('registration HTTP service', () => {
  it('submits the current legal versions and CSRF token with the registration request', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/register') return new Response(null, { status: 201 });
      throw new Error('Unexpected request: ' + call.path);
    });

    assert.deepEqual(await registerUser(input), { success: true });
    assert.deepEqual(calls.map((call) => call.path), ['/api/auth/csrf', '/api/auth/register']);
    assert.equal(calls[1].method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[1].body)), input);
    assert.equal(calls[1].credentials, 'include');
    assert.equal(calls[1].cache, 'no-store');
    assert.equal(calls[1].headers.get('X-CSRF-Token'), 'fixture-csrf');
  });

  it('does not submit registration if CSRF fails', async (t) => {
    const calls = mockHttp(t, () => new Response(null, { status: 403 }));

    const result = await registerUser(input);

    assert.equal(result.success, false);
    assert.deepEqual(calls.map((call) => call.path), ['/api/auth/csrf']);
  });

  it('requires renewed legal acceptance rather than repeating registration on an outdated version', async (t) => {
    const calls = mockHttp(t, (call) => call.path === '/api/auth/csrf'
      ? success({ csrfToken: 'fixture-csrf' })
      : Response.json({ error: { code: 'LEGAL_DOCUMENT_VERSION_OUTDATED' } }, { status: 409 }));

    const result = await registerUser(input);

    assert.equal(result.success, false);

    if (!result.success) assert.match(result.message, /Termos de Uso foram atualizados/);

    assert.equal(calls.filter((call) => call.path === '/api/auth/register').length, 1);
  });

  it('reports an uncertain registration instead of retrying an interrupted POST', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      throw new Error('fixture connection lost after submission');
    });

    const result = await registerUser(input);

    assert.equal(result.success, false);

    if (!result.success) assert.match(result.message, /confirmar o resultado do cadastro/);

    assert.equal(calls.length, 2);
  });
});
