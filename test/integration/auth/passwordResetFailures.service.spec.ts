import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requestPasswordReset, resetPassword } from '@/modules/auth/services/passwordReset.service';

import { mockHttp, success } from '../../support/http.fixture';

const token = 'a'.repeat(43);
const password = 'Fixture!password123';

describe('password recovery failure boundaries', () => {
  it('stops before a reset when the CSRF request is rejected or malformed', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, () => {
      attempt++;

      return attempt === 1 ? new Response(null, { status: 429 }) : success({ csrfToken: '' });
    });

    const limited = await resetPassword(token, password);
    const malformed = await resetPassword(token, password);

    assert.equal(limited.success, false);
    if (!limited.success) assert.equal(limited.rateLimited, true);

    assert.equal(malformed.success, false);
    if (!malformed.success) assert.match(malformed.message, /iniciar a solicitação/);

    assert.deepEqual(
      calls.map((call) => call.path),
      ['/api/auth/csrf', '/api/auth/csrf'],
    );
  });

  it('distinguishes a failed connection before and after sending a password recovery request', async (t) => {
    let csrfFails = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf' && !csrfFails) return success({ csrfToken: 'fixture-csrf' });

      throw new Error('Fixture connection lost');
    });

    const before = await requestPasswordReset('owner@example.invalid');

    assert.equal(before.success, false);
    if (!before.success) assert.match(before.message, /conectar ao serviço/);

    csrfFails = false;

    const after = await requestPasswordReset('owner@example.invalid');

    assert.equal(after.success, false);
    if (!after.success) assert.match(after.message, /confirmar o envio/);
    assert.equal(calls.filter((call) => call.path === '/api/auth/forgot-password').length, 1);
  });

  it('reports password policy errors and uncertain mutations without retrying a password change', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path !== '/api/auth/reset-password') throw new Error('Unexpected request');

      attempt++;
      if (attempt === 1) return new Response(null, { status: 422 });
      if (attempt === 2) throw new Error('Fixture connection lost');

      return new Response(null, { status: 204 });
    });

    const invalid = await resetPassword(token, password);
    const uncertain = await resetPassword(token, password);

    assert.equal(invalid.success, false);
    if (!invalid.success) assert.match(invalid.message, /não atende aos requisitos/);
    assert.equal(uncertain.success, false);
    if (!uncertain.success) assert.match(uncertain.message, /confirmar a alteração/);
    assert.deepEqual(await resetPassword(token, password), { success: true });
    assert.equal(calls.filter((call) => call.path === '/api/auth/reset-password').length, 3);
  });
});
