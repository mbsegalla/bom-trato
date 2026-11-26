import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SessionError, verifyEmailOnce } from '@/modules/auth/services/session.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

describe('email confirmation recovery', () => {
  it('rejects invalid tokens without making requests', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    await assert.rejects(verifyEmailOnce('invalid'), /inválido/);

    assert.equal(calls.length, 0);
  });

  it('shares a single verification for the same token and does not retry definitive errors automatically', async (t) => {
    const token = 'a'.repeat(43);
    let attempts = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/verify-email') {
        return ++attempts === 1 ? new Response(null, { status: 410 }) : sessionResponse();
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    const first = verifyEmailOnce(token);
    const second = verifyEmailOnce(token);

    assert.strictEqual(first, second);
    await assert.rejects(first, (error: unknown) => error instanceof SessionError && error.status === 410);
    await assert.rejects(second);
    assert.equal(attempts, 1);

    assert.deepEqual(await verifyEmailOnce(token, true), { kind: 'confirmed' });
    assert.equal(calls.filter((call) => call.path === '/api/auth/verify-email').length, 2);
  });

  it('recovers uncertain confirmation only after reading a verified account', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/verify-email') return new Response(null, { status: 503 });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/auth/me')
        return success({
          id: organizationId,
          name: 'Fixture user',
          email: 'owner@example.invalid',
          emailVerified: true,
          selectedPlanPriceId: null,
        });
      throw new Error('Unexpected request: ' + call.path);
    });

    assert.deepEqual(await verifyEmailOnce('b'.repeat(43)), { kind: 'recovered', email: 'owner@example.invalid' });
    assert.deepEqual(
      calls.map((call) => call.path),
      ['/api/auth/csrf', '/api/auth/verify-email', '/api/auth/csrf', '/api/auth/refresh', '/api/auth/me'],
    );
  });
});
