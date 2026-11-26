import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  createWorkOrderChecklistItem,
  deleteWorkOrderChecklistItem,
  getWorkOrderChecklist,
  updateWorkOrderChecklistItem,
  WorkOrderChecklistError,
} from '@/modules/workOrders/services/workOrderChecklist.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/checklist';
const date = '2026-01-01T00:00:00.000Z';
const item = {
  id: issuanceId,
  title: 'Fixture item',
  position: 0,
  completed: false,
  completedAt: null,
  completedById: null,
  visibleInPortal: false,
  version: 1,
  createdAt: date,
  updatedAt: date,
};

describe('checklist lifecycle and refresh contracts', () => {
  it('creates, reads, completes and removes a scoped checklist item with optimistic versions', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route && call.method === 'GET') return success({ items: [item], progress: { total: 1, completed: 0 } });
      if (call.path === route && call.method === 'POST') return success(item);
      if (call.path === route + '/' + issuanceId && call.method === 'PATCH') {
        return success({ ...item, completed: true, completedAt: date, completedById: organizationId, version: 2 });
      }
      if (call.path === route + '/' + issuanceId && call.method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const created = await createWorkOrderChecklistItem(organizationId, receivableId, { title: item.title });
    const list = await getWorkOrderChecklist(organizationId, receivableId);
    const updated = await updateWorkOrderChecklistItem(organizationId, receivableId, created, { completed: true });

    await deleteWorkOrderChecklistItem(organizationId, receivableId, updated);

    assert.equal(list.progress.total, 1);
    assert.deepEqual(updated.completedAt, new Date(date));

    const requests = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(requests.map((call) => call.method), ['POST', 'GET', 'PATCH', 'DELETE']);
    assert.deepEqual(JSON.parse(String(requests[2]?.body)), { version: 1, completed: true });
    assert.deepEqual(JSON.parse(String(requests[3]?.body)), { version: 2 });
  });

  it('flags malformed reads, missing items and stale changes for refresh without repeating mutations', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) {
        attempt++;
        if (attempt === 1) return success({ items: [], progress: { total: -1, completed: 0 } });
        if (attempt === 2) return new Response(null, { status: 404 });
        return new Response(null, { status: 409 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getWorkOrderChecklist(organizationId, receivableId), (error: unknown) =>
      error instanceof WorkOrderChecklistError && error.refreshRequired,
    );

    const current = { ...item, createdAt: new Date(date), updatedAt: new Date(date) };

    await assert.rejects(deleteWorkOrderChecklistItem(organizationId, receivableId, current), (error: unknown) =>
      error instanceof WorkOrderChecklistError && error.refreshRequired,
    );
    await assert.rejects(updateWorkOrderChecklistItem(organizationId, receivableId, current, { completed: true }), (error: unknown) =>
      error instanceof WorkOrderChecklistError && error.refreshRequired && /outra sessão/.test(error.message),
    );

    assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 3);
  });
});
