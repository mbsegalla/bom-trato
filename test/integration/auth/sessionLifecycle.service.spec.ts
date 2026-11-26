import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  authenticatedFetch,
  getCurrentUser,
  listSessions,
  login,
  loginWithGoogle,
  logout,
  logoutAll,
  restoreSession,
  revokeSession,
  SessionError,
} from '@/modules/auth/services/session.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const date = '2025-01-01T00:00:00.000Z';
const user = {
  id: organizationId,
  name: 'Fixture user',
  email: 'owner@example.invalid',
  emailVerified: true,
  selectedPlanPriceId: null,
};

describe('session lifecycle contracts', () => {
  it('serializes login operations and sends Google legal acceptance and selected price', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/login' || call.path === '/api/auth/google') return sessionResponse();
      throw new Error('Unexpected request: ' + call.path);
    });

    await Promise.all([
      login(user.email, 'fixture-password'),
      loginWithGoogle('fixture-credential', receivableId, { termsVersion: '1', privacyNoticeVersion: '2' }),
    ]);

    assert.deepEqual(
      calls.map((call) => call.path),
      ['/api/auth/csrf', '/api/auth/login', '/api/auth/csrf', '/api/auth/google'],
    );
    assert.deepEqual(JSON.parse(String(calls[1].body)), { email: user.email, password: 'fixture-password' });
    assert.deepEqual(JSON.parse(String(calls[3].body)), {
      credential: 'fixture-credential',
      selectedPlanPriceId: receivableId,
      termsVersion: '1',
      privacyNoticeVersion: '2',
    });
  });

  it('preserves typed login errors and allows a later successful operation', async (t) => {
    let attempt = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/login') {
        attempt++;
        if (attempt === 1) return Response.json({ error: { code: 'INVALID_CREDENTIALS' } }, { status: 401 });
        if (attempt === 2) return new Response(null, { status: 429 });
        return sessionResponse();
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await assert.rejects(
      login(user.email, 'wrong'),
      (error: unknown) =>
        error instanceof SessionError &&
        error.status === 401 &&
        error.code === 'INVALID_CREDENTIALS' &&
        !error.uncertain,
    );
    await assert.rejects(login(user.email, 'wrong'), /Muitas tentativas/);
    await login(user.email, 'fixture-password');

    assert.equal(attempt, 3);
  });

  it('deduplicates current user and session reads and revokes scoped sessions', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/auth/me') return success(user);
      if (call.path === '/api/auth/sessions')
        return success([
          {
            id: receivableId,
            createdAt: date,
            lastRefreshedAt: date,
            absoluteExpiresAt: date,
            userAgent: null,
            current: false,
          },
        ]);
      if (call.path === '/api/auth/sessions/' + receivableId) return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const current = getCurrentUser();
    const duplicate = getCurrentUser();
    const sessions = listSessions();
    const duplicateSessions = listSessions();

    assert.strictEqual(current, duplicate);
    assert.strictEqual(sessions, duplicateSessions);
    assert.equal((await current).email, user.email);
    assert.deepEqual((await sessions)[0].createdAt, new Date(date));

    await revokeSession(receivableId, false);
    await listSessions();

    assert.equal(calls.filter((call) => call.path === '/api/auth/me').length, 1);
    assert.equal(calls.filter((call) => call.path === '/api/auth/sessions').length, 2);
    assert.ok(calls.some((call) => call.path === '/api/auth/sessions/' + receivableId && call.method === 'DELETE'));
  });

  it('clears credentials after logout and logout-all, forcing a new refresh before protected requests', async (t) => {
    let refreshes = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse('token-' + ++refreshes);
      if (call.path === '/api/auth/logout' || call.path === '/api/auth/logout-all')
        return new Response(null, { status: 204 });
      if (call.path === '/api/protected') return success({});
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    await logout();
    await authenticatedFetch('/api/protected');
    await logoutAll();
    await authenticatedFetch('/api/protected');

    assert.equal(refreshes, 3);
    assert.deepEqual(
      calls.filter((call) => call.path === '/api/protected').map((call) => call.headers.get('Authorization')),
      ['Bearer token-2', 'Bearer token-3'],
    );
  });
  it('refreshes once after concurrent unauthorized responses and replays with the new token', async (t) => {
    let refreshes = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse('token-' + ++refreshes);
      if (call.path === '/api/protected') {
        return call.headers.get('Authorization') === 'Bearer token-1'
          ? new Response(null, { status: 401 })
          : success({});
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    const responses = await Promise.all([authenticatedFetch('/api/protected'), authenticatedFetch('/api/protected')]);

    assert.deepEqual(
      responses.map((response) => response.status),
      [200, 200],
    );
    assert.equal(refreshes, 2);
    assert.equal(calls.filter((call) => call.path === '/api/protected').length, 4);
  });

  it('does not refresh indefinitely when the renewed token is also unauthorized', async (t) => {
    let refreshes = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse('token-' + ++refreshes);
      if (call.path === '/api/protected') return new Response(null, { status: 401 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await authenticatedFetch('/api/protected')).status, 401);
    assert.equal(refreshes, 2);
    assert.equal(calls.filter((call) => call.path === '/api/protected').length, 2);
  });

  it('does not refresh or replay a forbidden request', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/protected') return new Response(null, { status: 403 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await authenticatedFetch('/api/protected')).status, 403);
    assert.equal(calls.filter((call) => call.path === '/api/auth/refresh').length, 1);
    assert.equal(calls.filter((call) => call.path === '/api/protected').length, 1);
  });

  it('clears stale credentials after a failed refresh and permits a later recovery', async (t) => {
    let refreshes = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') {
        refreshes++;
        return refreshes === 2 ? new Response(null, { status: 401 }) : sessionResponse('token-' + refreshes);
      }
      if (call.path === '/api/protected') return success({});
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    await assert.rejects(restoreSession(), (error: unknown) => error instanceof SessionError && error.status === 401);
    await authenticatedFetch('/api/protected');

    assert.equal(refreshes, 3);
    assert.equal(
      calls.filter((call) => call.path === '/api/protected')[0]?.headers.get('Authorization'),
      'Bearer token-3',
    );
  });
  for (const [code, message] of [
    ['GOOGLE_ACCOUNT_LINK_REQUIRED', /conta já existe/],
    ['GOOGLE_EMAIL_MISMATCH', /mesmo e-mail/],
    ['GOOGLE_IDENTITY_IN_USE', /já está vinculada/],
    ['GOOGLE_PROVIDER_ALREADY_LINKED', /já está vinculada/],
    ['TERMS_ACCEPTANCE_REQUIRED', /aceite os Termos/],
    ['LEGAL_DOCUMENT_VERSION_OUTDATED', /Termos de Uso foram atualizados/],
  ] as const) {
    it('preserves Google authentication restriction ' + code, async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        return Response.json({ error: { code } }, { status: 409 });
      });
      await assert.rejects(
        loginWithGoogle('fixture-credential'),
        (error: unknown) =>
          error instanceof SessionError && error.status === 409 && error.code === code && message.test(error.message),
      );
      assert.equal(calls.filter((call) => call.path === '/api/auth/google').length, 1);
      assert.deepEqual(JSON.parse(String(calls[1]?.body)), {
        credential: 'fixture-credential',
        selectedPlanPriceId: null,
      });
    });
  }

  for (const [status, message] of [
    [401, /validar sua conta Google/],
    [403, /validar sua conta Google/],
    [500, /entrar com Google/],
  ] as const) {
    it('maps generic Google failure ' + status + ' with correct uncertainty', async (t) => {
      mockHttp(t, (call) =>
        call.path === '/api/auth/csrf' ? success({ csrfToken: 'fixture-csrf' }) : new Response(null, { status }),
      );
      await assert.rejects(
        loginWithGoogle('fixture-credential'),
        (error: unknown) =>
          error instanceof SessionError &&
          error.status === status &&
          error.uncertain === status >= 500 &&
          message.test(error.message),
      );
    });
  }

  for (const [status, message] of [
    [403, /Confirme seu e-mail/],
    [500, /Não foi possível entrar/],
  ] as const) {
    it('reports login failure ' + status + ' without silently retrying', async (t) => {
      const calls = mockHttp(t, (call) =>
        call.path === '/api/auth/csrf' ? success({ csrfToken: 'fixture-csrf' }) : new Response(null, { status }),
      );
      await assert.rejects(login(user.email, 'fixture-password'), message);
      assert.equal(calls.filter((call) => call.path === '/api/auth/login').length, 1);
    });
  }

  it('does not start login while CSRF is rate limited', async (t) => {
    const calls = mockHttp(t, () => new Response(null, { status: 429 }));
    await assert.rejects(
      login(user.email, 'fixture-password'),
      (error: unknown) => error instanceof SessionError && error.status === 429 && !error.uncertain,
    );
    assert.deepEqual(
      calls.map((call) => call.path),
      ['/api/auth/csrf'],
    );
  });

  it('marks a malformed login success or interrupted submission as uncertain', async (t) => {
    let interrupted = false;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (interrupted) throw new Error('fixture transport failure');
      return success({ invalid: true });
    });
    await assert.rejects(
      login(user.email, 'fixture-password'),
      (error: unknown) => error instanceof SessionError && error.uncertain && error.status === 0,
    );
    interrupted = true;
    await assert.rejects(
      login(user.email, 'fixture-password'),
      (error: unknown) => error instanceof SessionError && error.uncertain && error.status === 0,
    );
    assert.equal(calls.filter((call) => call.path === '/api/auth/login').length, 2);
  });

  it('clears failed account and session read flights and rejects malformed payloads', async (t) => {
    let malformed = false;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return malformed ? success({ invalid: true }) : new Response(null, { status: 503 });
    });
    await restoreSession();
    await assert.rejects(getCurrentUser(), /carregar sua conta/);
    await assert.rejects(listSessions(), /carregar suas sessões/);
    malformed = true;
    await assert.rejects(getCurrentUser(), /ler sua conta/);
    await assert.rejects(listSessions(), /interpretar suas sessões/);
  });

  it('does not discard the current session when logout or revocation fails transiently', async (t) => {
    let refreshes = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse('token-' + ++refreshes);
      if (call.path === '/api/protected') return success({});
      return new Response(null, { status: 503 });
    });
    await restoreSession();
    await assert.rejects(logout(), /encerrar sua sessão/);
    await assert.rejects(logoutAll(), /encerrar todas as sessões/);
    await assert.rejects(revokeSession(receivableId, true), /encerrar esta sessão/);
    await authenticatedFetch('/api/protected');
    assert.equal(refreshes, 1);
    assert.equal(calls.at(-1)?.headers.get('Authorization'), 'Bearer token-1');
  });
});
