import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createWorkOrderChecklistItem, reorderWorkOrderChecklist, updateWorkOrderChecklistItem, WorkOrderChecklistError } from '@/modules/workOrders/services/workOrderChecklist.service';
import type { WorkOrderChecklistItem } from '@/modules/workOrders/types/workOrderChecklist.types';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';
const now = new Date('2026-01-01T00:00:00Z');
const item: WorkOrderChecklistItem = { id: issuanceId, title: 'Fixture', position: 0, completed: false, completedAt: null, completedById: null, visibleInPortal: false, version: 3, createdAt: now, updatedAt: now };
describe('checklist service', () => {
  it('reorders only the intended item identities and versions', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ items: [item], progress: { total: 1, completed: 0 } });
    });
    await restoreSession();
    await reorderWorkOrderChecklist(organizationId, receivableId, [item]);
    const request = calls.at(-1)!;
    assert.equal(request.method, 'PATCH');
    assert.equal(request.path, '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/checklist/reorder');
    assert.deepEqual(JSON.parse(String(request.body)), { items: [{ id: issuanceId, version: 3 }] });
  });
  it('requires refresh after stale or uncertain changes and does not retry writes', async (t) => {
    let conflict = true;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (conflict) return Response.json({ error: { code: 'WORK_ORDER_CHECKLIST_LIMIT_REACHED' } }, { status: 409 });
      throw new Error('fixture lost connection');
    });
    await restoreSession();
    await assert.rejects(createWorkOrderChecklistItem(organizationId, receivableId, { title: 'New' }), (error: unknown) => error instanceof WorkOrderChecklistError && error.refreshRequired && /50 itens/.test(error.message));
    conflict = false;
    await assert.rejects(updateWorkOrderChecklistItem(organizationId, receivableId, item, { completed: true }), (error: unknown) => error instanceof WorkOrderChecklistError && error.refreshRequired);
    assert.equal(calls.filter((call) => call.path.includes('/checklist')).length, 2);
  });
});
