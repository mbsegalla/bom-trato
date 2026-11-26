import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getWorkOrderScheduleHistory, getWorkOrderStatusHistory, sendWorkOrderReviewInvitation } from '@/modules/workOrders/services/workOrder.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId;
const date = '2025-01-01T00:00:00.000Z';

describe('work order history and review contracts', () => {
  it('coalesces status history by version and converts dates', async (t) => {
    const item = {
      id: issuanceId,
      workOrderId: receivableId,
      fromStatus: 'OPEN',
      toStatus: 'SCHEDULED',
      actorId: organizationId,
      version: 2,
      reason: null,
      createdAt: date,
    };
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/status-history') return success([item]);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getWorkOrderStatusHistory(organizationId, receivableId, 1);
    const duplicate = getWorkOrderStatusHistory(organizationId, receivableId, 1);
    const newer = getWorkOrderStatusHistory(organizationId, receivableId, 2);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, newer);

    const [result] = await Promise.all([first, newer]);

    assert.deepEqual(result[0]?.createdAt, new Date(date));
    assert.equal(calls.filter((call) => call.path.endsWith('/status-history')).length, 2);
  });

  it('keeps schedule history pages and versions separate and clears failed flights', async (t) => {
    let fail = true;

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route + '/schedule-history?')) {
        if (fail) {
          fail = false;
          return new Response(null, { status: 503 });
        }
        const page = Number(new URLSearchParams(call.path.split('?')[1]).get('page'));
        return success({ items: [], page, hasMore: false });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getWorkOrderScheduleHistory(organizationId, receivableId, 1, 1), /atualizadas/);

    const first = getWorkOrderScheduleHistory(organizationId, receivableId, 1, 1);
    const second = getWorkOrderScheduleHistory(organizationId, receivableId, 1, 2);

    assert.strictEqual(first, getWorkOrderScheduleHistory(organizationId, receivableId, 1, 1));
    assert.notStrictEqual(first, second);

    assert.deepEqual((await Promise.all([first, second])).map((page) => page.page), [1, 2]);
    assert.equal(calls.filter((call) => call.path.includes('/schedule-history?')).length, 3);
  });

  it('distinguishes email and WhatsApp delivery and rejects malformed responses or unfinished work', async (t) => {
    let attempt = 0;

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/review-invitation') {
        attempt++;
        if (attempt === 1) return success({ channel: 'EMAIL', recipient: 'customer@example.invalid', token: null, organizationName: 'Fixture' });
        if (attempt === 2) return success({ channel: 'WHATSAPP', recipient: '34999991234', token: 'fixture-token', organizationName: 'Fixture' });
        if (attempt === 3) return success({ channel: 'EMAIL', recipient: 'customer@example.invalid', token: 'unexpected', organizationName: 'Fixture' });
        return Response.json({ error: { code: 'WORK_ORDER_NOT_COMPLETED' } }, { status: 409 });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await sendWorkOrderReviewInvitation(organizationId, receivableId)).channel, 'EMAIL');
    assert.equal((await sendWorkOrderReviewInvitation(organizationId, receivableId)).channel, 'WHATSAPP');
    await assert.rejects(sendWorkOrderReviewInvitation(organizationId, receivableId), /interpretar/);
    await assert.rejects(sendWorkOrderReviewInvitation(organizationId, receivableId), /Conclua o serviço/);

    const requests = calls.filter((call) => call.path.endsWith('/review-invitation'));

    assert.equal(requests.length, 4);
    assert.ok(requests.every((call) => call.method === 'POST'));
  });
});
