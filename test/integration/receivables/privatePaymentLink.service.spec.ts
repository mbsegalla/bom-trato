import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createReceivablePaymentLink, getReceivablePaymentLinkStatus, revokeReceivablePaymentLink } from '@/modules/receivables/services/receivablePaymentLink.service';

import { installBrowserStorage } from '../../support/browserStorage.fixture';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/receivables/' + receivableId + '/payment-link';
const token = 'a'.repeat(64);
const expiresAt = '2030-01-01T00:00:00.000Z';
const origin = 'https://app.example.invalid';
const validUrl = origin + '/pagar#token=' + token;

describe('private receivable payment links', () => {
  it('creates versioned links, reads their status and revokes them using scoped methods', async (t) => {
    const browser = installBrowserStorage(t);
    Object.defineProperty(browser, 'location', { value: { origin } });

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path !== route) throw new Error('Unexpected request: ' + call.path);
      if (call.method === 'POST') return success({ url: validUrl, expiresAt });
      if (call.method === 'DELETE') return new Response(null, { status: 204 });
      return success({ active: true, expiresAt });
    });

    await restoreSession();

    const created = await createReceivablePaymentLink(organizationId, receivableId, 3);
    const status = await getReceivablePaymentLinkStatus(organizationId, receivableId);

    await revokeReceivablePaymentLink(organizationId, receivableId);

    assert.equal(created.url, validUrl);
    assert.deepEqual(created.expiresAt, new Date(expiresAt));
    assert.equal(status?.active, true);

    const requests = calls.filter((call) => call.path === route);

    assert.deepEqual(requests.map((call) => call.method), ['POST', 'GET', 'DELETE']);
    assert.deepEqual(JSON.parse(String(requests[0]?.body)), { version: 3 });
    assert.ok(requests.every((call) => call.headers.has('Authorization')));
  });

  it('refuses cross-origin links, query tokens, credentials, wrong routes and extra fragment fields', async (t) => {
    const browser = installBrowserStorage(t);
    Object.defineProperty(browser, 'location', { value: { origin } });

    const unsafe = [
      'https://other.example.invalid/pagar#token=' + token,
      origin + '/wrong#token=' + token,
      origin + '/pagar?token=' + token,
      'https://name:secret@app.example.invalid/pagar#token=' + token,
      validUrl + '&extra=1',
      origin + '/pagar#token=invalid',
    ];

    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success({ url: unsafe[attempt++], expiresAt });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    for (const _url of unsafe) {
      await assert.rejects(createReceivablePaymentLink(organizationId, receivableId, 3), /confirmar o endereço/);
    }

    assert.equal(attempt, unsafe.length);
  });

  it('handles absent links, permission errors and stale financial versions without repeating mutations', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'GET') return success(null);
      if (call.path === route && call.method === 'POST') return new Response(null, { status: 409 });
      if (call.path === route && call.method === 'DELETE') return new Response(null, { status: 403 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal(await getReceivablePaymentLinkStatus(organizationId, receivableId), null);
    await assert.rejects(createReceivablePaymentLink(organizationId, receivableId, 2), /saldo atualizado/);
    await assert.rejects(revokeReceivablePaymentLink(organizationId, receivableId), /proprietário autorizado/);

    assert.equal(calls.filter((call) => call.path === route).length, 3);
  });
});
