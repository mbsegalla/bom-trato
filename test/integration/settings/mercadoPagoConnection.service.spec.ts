import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  completeMercadoPagoConnection,
  startMercadoPagoConnection,
} from '@/modules/settings/services/mercadoPagoConnection.service';

import { mockHttp, organizationId, sessionResponse, success } from '../../support/http.fixture';

const origin = 'https://web.example.invalid';
const route = '/api/organizations/' + organizationId + '/mercado-pago/connection/start';
function authorizationUrl() {
  const url = new URL('https://auth.mercadopago.com/authorization');
  url.searchParams.set('redirect_uri', origin + '/mercado-pago/callback');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', 'a'.repeat(43));
  url.searchParams.set('code_challenge', 'b'.repeat(43));

  return url;
}

describe('Mercado Pago OAuth HTTP boundary', () => {
  it('accepts only the correct OAuth origin, callback, state and PKCE challenge', async (t) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin } } });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
      else Reflect.deleteProperty(globalThis, 'window');
    });
    let url = authorizationUrl();
    let expiresAt = new Date(Date.now() + 600000).toISOString();
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      assert.equal(call.path, route);

      return success({ authorizationUrl: url.toString(), expiresAt });
    });

    await restoreSession();

    assert.equal((await startMercadoPagoConnection(organizationId)).authorizationUrl, url.toString());

    for (const change of [
      (value: URL) => {
        value.hostname = 'untrusted.example.invalid';
      },
      (value: URL) => {
        value.pathname = '/different';
      },
      (value: URL) => {
        value.searchParams.set('redirect_uri', 'https://untrusted.example.invalid/callback');
      },
      (value: URL) => {
        value.searchParams.set('code_challenge_method', 'plain');
      },
      (value: URL) => {
        value.searchParams.delete('state');
      },
    ]) {
      url = authorizationUrl();
      change(url);

      await assert.rejects(startMercadoPagoConnection(organizationId), /endereço de autorização/);
    }
    url = authorizationUrl();
    expiresAt = new Date(Date.now() - 1000).toISOString();

    await assert.rejects(startMercadoPagoConnection(organizationId), /iniciar a autorização/);
    assert.equal(calls.filter((call) => call.path === route).length, 7);
  });

  it('sends state and authorization code only to the completion endpoint and does not replay a failed exchange', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();

      return new Response(null, { status: 409 });
    });

    await restoreSession();

    await assert.rejects(completeMercadoPagoConnection('fixture-state', 'fixture-code'), /não pode ser vinculada/);

    const requests = calls.filter((call) => call.path === '/api/mercado-pago/connection/complete');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0].body)), { state: 'fixture-state', code: 'fixture-code' });
  });
});
