import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  cancelWorkOrder,
  createWorkOrderFromQuote,
  getWorkOrder,
  startWorkOrder,
  updateWorkOrder,
  updateWorkOrderExecutionNotes,
} from '@/modules/workOrders/services/workOrder.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const base = '/api/organizations/' + organizationId + '/work-orders';
const route = base + '/' + receivableId;
const date = '2025-01-01T00:00:00.000Z';
const row = {
  id: receivableId,
  organizationId,
  quoteId: issuanceId,
  customerId: issuanceId,
  customerName: 'Fixture customer',
  customerEmail: null,
  customerPhone: null,
  title: 'Fixture service',
  instructions: null,
  serviceAddress: null,
  executionNotes: null,
  assignedToId: null,
  status: 'OPEN',
  currency: 'brl',
  subtotalInCents: 1000,
  discountInCents: 0,
  totalInCents: 1000,
  scheduledStartAt: null,
  scheduledEndAt: null,
  startedAt: null,
  completedAt: null,
  canceledAt: null,
  cancellationReason: null,
  version: 1,
  createdById: organizationId,
  updatedById: organizationId,
  createdAt: date,
  updatedAt: date,
  items: [],
};

describe('work order lifecycle contracts', () => {
  it('creates from an approved quote and preserves optimistic versions on planning, start, notes and cancellation', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === base || call.path.startsWith(route)) return success(row);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const planning = { title: 'Updated service', instructions: null, serviceAddress: 'Fixture address' };
    const notes = { executionNotes: 'Fixture execution' };

    assert.equal((await createWorkOrderFromQuote(organizationId, issuanceId)).id, receivableId);
    await updateWorkOrder(organizationId, receivableId, 1, planning);
    await startWorkOrder(organizationId, receivableId, 2);
    await updateWorkOrderExecutionNotes(organizationId, receivableId, 3, notes);
    await cancelWorkOrder(organizationId, receivableId, 4, 'Fixture cancellation');

    const requests = calls.filter((call) => call.path.startsWith(base));

    assert.deepEqual(requests.map((call) => [call.path, call.method]), [
      [base, 'POST'],
      [route, 'PATCH'],
      [route + '/start', 'POST'],
      [route + '/execution-notes', 'PATCH'],
      [route + '/cancel', 'POST'],
    ]);

    assert.deepEqual(requests.map((call) => JSON.parse(String(call.body))), [
      { quoteId: issuanceId },
      { version: 1, ...planning },
      { version: 2 },
      { version: 3, ...notes },
      { version: 4, reason: 'Fixture cancellation' },
    ]);
  });

  it('deduplicates detail reads for the same organization without sharing another organization response', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/work-orders/' + receivableId)) {
        return success({ ...row, organizationId: call.path.split('/')[3] });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getWorkOrder(organizationId, receivableId);
    const duplicate = getWorkOrder(organizationId, receivableId);
    const other = getWorkOrder(issuanceId, receivableId);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);

    const [result, otherResult] = await Promise.all([first, other]);

    assert.equal(result.organizationId, organizationId);
    assert.equal(otherResult.organizationId, issuanceId);
    assert.deepEqual(result.createdAt, new Date(date));
    assert.equal(calls.filter((call) => call.path.endsWith('/work-orders/' + receivableId)).length, 2);
  });

  it('clears failed detail flights and rejects malformed financial values', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 404 });
        if (attempt === 2) return success({ ...row, totalInCents: -1 });
        return success(row);
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getWorkOrder(organizationId, receivableId), /não encontrada/);
    await assert.rejects(getWorkOrder(organizationId, receivableId), /interpretar/);
    assert.equal((await getWorkOrder(organizationId, receivableId)).totalInCents, 1000);
    assert.equal(attempt, 3);
  });
});
