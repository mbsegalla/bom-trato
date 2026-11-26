import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getWorkOrderWarranty, updateWorkOrderWarranty } from '@/modules/workOrders/services/workOrderDocument.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/warranty';
const input = { durationDays: 90, terms: 'Fixture warranty' };
const date = '2030-01-01T00:00:00.000Z';

describe('work order warranty contracts', () => {
  it('rejects invalid terms and durations before accessing the API', async (t) => {
    const calls = mockHttp(t, () => {
      throw new Error('Unexpected request');
    });

    for (const invalid of [
      { ...input, durationDays: 0 },
      { ...input, durationDays: 3651 },
      { ...input, durationDays: 1.5 },
      { ...input, terms: '  ' },
    ]) {
      await assert.rejects(updateWorkOrderWarranty(organizationId, receivableId, 0, invalid));
    }

    assert.equal(calls.length, 0);
  });

  it('reads and saves scoped warranty terms with trimmed input and the current version', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'GET') return success({ warranty: null, locked: false });
      if (call.path === route && call.method === 'PUT') {
        return success({ warranty: { ...input, version: 1, expiresAt: date }, locked: false });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.deepEqual(await getWorkOrderWarranty(organizationId, receivableId), { warranty: null, locked: false });

    const updated = await updateWorkOrderWarranty(organizationId, receivableId, 0, {
      ...input,
      terms: '  Fixture warranty  ',
    });

    assert.deepEqual(updated.warranty?.expiresAt, new Date(date));

    const request = calls.find((call) => call.path === route && call.method === 'PUT');

    assert.deepEqual(JSON.parse(String(request?.body)), { ...input, version: 0 });
  });

  it('reports a locked warranty, permission denial and malformed warranty response', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 409 });
        if (attempt === 2) return new Response(null, { status: 403 });
        return success({ warranty: { ...input, version: 0, expiresAt: null }, locked: false });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(updateWorkOrderWarranty(organizationId, receivableId, 0, input), /bloqueadas/);
    await assert.rejects(getWorkOrderWarranty(organizationId, receivableId), /permissão/);
    await assert.rejects(getWorkOrderWarranty(organizationId, receivableId), /interpretar/);
    assert.equal(attempt, 3);
  });
});
