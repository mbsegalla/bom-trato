import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  acceptPublicWorkOrder,
  getWorkOrderAcceptance,
  PublicWorkOrderAcceptanceError,
} from '@/modules/workOrders/services/workOrderAcceptance.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const token = 'a'.repeat(64);
const hash = 'b'.repeat(64);
const date = '2026-01-01T00:00:00.000Z';
const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/acceptance';
const receipt = {
  id: issuanceId,
  acceptedAt: date,
  completedAt: date,
  signerName: 'Fixture customer',
  workOrderVersion: 2,
  consentVersion: '1',
  consentText: 'Fixture consent',
  snapshotHash: hash,
  snapshot: {
    schemaVersion: 1,
    organizationName: 'Fixture business',
    workOrder: {
      title: 'Fixture service',
      currency: 'brl',
      subtotalInCents: 1000,
      discountInCents: 0,
      totalInCents: 1000,
      completedAt: date,
      version: 2,
      items: [],
    },
  },
};

describe('private work order acceptance status', () => {
  it('reads an absent or complete receipt within the authenticated scope', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success({ receipt: ++attempt === 1 ? null : receipt });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.deepEqual(await getWorkOrderAcceptance(organizationId, receivableId), { receipt: null });
    const result = await getWorkOrderAcceptance(organizationId, receivableId);

    assert.equal(result.receipt?.snapshotHash, hash);
    assert.deepEqual(result.receipt?.acceptedAt, new Date(date));
    assert.equal(result.receipt?.snapshot.workOrder.totalInCents, 1000);
    assert.equal(calls.filter((call) => call.path === route && call.method === 'GET').length, 2);
  });

  it('rejects malformed receipts and denied or missing orders', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return success({ receipt: { ...receipt, snapshotHash: 'invalid' } });
        if (attempt === 2) return new Response(null, { status: 403 });
        return new Response(null, { status: 404 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getWorkOrderAcceptance(organizationId, receivableId), /interpretar/);
    await assert.rejects(getWorkOrderAcceptance(organizationId, receivableId), /permissão/);
    await assert.rejects(getWorkOrderAcceptance(organizationId, receivableId), /não está mais disponível/);
  });
});

describe('public acceptance error contracts', () => {
  it('blocks an invalid signer before network access', async (t) => {
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });

    await assert.rejects(acceptPublicWorkOrder(token, hash, '1', { signerName: ' ', consent: true }), /pelo menos 2/);
    assert.equal(calls.length, 0);
  });

  it('requires a refresh for an uncertain successful response or inaccessible acceptance but not ordinary validation or rate limits', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, () => {
      attempt++;
      if (attempt === 1) return success({ acceptedAt: 'invalid' });
      return new Response(null, { status: [0, 0, 403, 400, 429][attempt] });
    });
    const input = { signerName: 'Fixture customer', consent: true as const };

    for (const refreshRequired of [true, true, false, false]) {
      await assert.rejects(acceptPublicWorkOrder(token, hash, '1', input), (error: unknown) =>
        error instanceof PublicWorkOrderAcceptanceError && error.refreshRequired === refreshRequired,
      );
    }

    assert.equal(calls.length, 4);
  });
});
