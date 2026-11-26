import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createWorkOrderShare, getWorkOrderShare, revokeWorkOrderShare } from '@/modules/workOrders/services/workOrderPortal.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/share';
const token = 'a'.repeat(64);
const date = '2025-01-01T00:00:00.000Z';
const url = 'https://app.example.invalid/acompanhar#token=' + token;

describe('private work order share contracts', () => {
  it('sends a versioned expiry and parses the share dates before revocation', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path !== route) throw new Error('Unexpected request: ' + call.path);
      if (call.method === 'POST') return success({ id: issuanceId, url, createdAt: date, expiresAt: '2030-01-01T00:00:00.000Z' });
      if (call.method === 'DELETE') return new Response(null, { status: 204 });
      return success({ id: issuanceId, createdAt: date, expiresAt: '2030-01-01T00:00:00.000Z' });
    });

    await restoreSession();

    const before = Date.now();
    const share = await createWorkOrderShare(organizationId, receivableId, 2, 7);
    const after = Date.now();
    const status = await getWorkOrderShare(organizationId, receivableId);

    await revokeWorkOrderShare(organizationId, receivableId);

    const requests = calls.filter((call) => call.path === route);
    const body = JSON.parse(String(requests[0]?.body));
    const expiration = new Date(body.expiresAt).getTime();

    assert.equal(share.url, url);
    assert.equal(status?.id, issuanceId);
    assert.deepEqual(share.createdAt, new Date(date));
    assert.deepEqual(requests.map((call) => call.method), ['POST', 'GET', 'DELETE']);
    assert.equal(body.version, 2);
    assert.ok(expiration >= before + 7 * 86400000 && expiration <= after + 7 * 86400000);
  });

  it('refuses unsafe URLs and reports revoked or stale shares without retrying', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return success(null);
        if (attempt === 2) return success({ id: issuanceId, url: 'https://app.example.invalid/acompanhar?token=' + token, createdAt: date, expiresAt: date });
        if (attempt === 3) return new Response(null, { status: 409 });
        return new Response(null, { status: 403 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal(await getWorkOrderShare(organizationId, receivableId), null);
    await assert.rejects(createWorkOrderShare(organizationId, receivableId, 2, 7), /interpretar/);
    await assert.rejects(createWorkOrderShare(organizationId, receivableId, 2, 7), /alterados/);
    await assert.rejects(revokeWorkOrderShare(organizationId, receivableId), /permissão/);
    assert.equal(attempt, 4);
  });
});
