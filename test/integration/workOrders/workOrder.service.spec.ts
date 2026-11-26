import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { assignWorkOrder, completeWorkOrder, listWorkOrders, scheduleWorkOrder } from '@/modules/workOrders/services/workOrder.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders';
describe('work order HTTP service', () => {
  it('deduplicates a scoped list but not other organization or assignee filters', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ page: 1, hasMore: false, items: [] });
    });
    await restoreSession();
    const input = { page: 1, limit: 10, status: 'ALL' as const };
    const first = listWorkOrders(organizationId, input);
    assert.strictEqual(first, listWorkOrders(organizationId, input));
    await Promise.all([first, listWorkOrders(receivableId, input), listWorkOrders(organizationId, { ...input, assignedToId: issuanceId })]);
    const requests = calls.filter((call) => call.path.includes('/work-orders?'));
    assert.equal(requests.length, 3);
    assert.ok(requests.some((call) => call.path.includes('assignedToId=' + issuanceId)));
  });
  it('forwards optimistic versions for schedule, assignment and completion without retrying conflicts', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return new Response(null, { status: 409 });
    });
    await restoreSession();
    const input = { scheduledStartAt: '2028-01-01T12:00:00Z', scheduledEndAt: '2028-01-01T13:00:00Z' };
    await assert.rejects(scheduleWorkOrder(organizationId, receivableId, 3, input), /conflito de agenda/);
    await assert.rejects(assignWorkOrder(organizationId, receivableId, 3, issuanceId), /conflito de agenda/);
    await assert.rejects(completeWorkOrder(organizationId, receivableId, 3), /conflito de agenda/);
    const requests = calls.filter((call) => call.path.startsWith(route));
    assert.deepEqual(requests.map((call) => call.path), [
      route + '/' + receivableId + '/schedule', route + '/' + receivableId + '/assign', route + '/' + receivableId + '/complete',
    ]);
    assert.deepEqual(requests.map((call) => JSON.parse(String(call.body))), [
      { version: 3, ...input }, { version: 3, assignedToId: issuanceId }, { version: 3 },
    ]);
  });
});
