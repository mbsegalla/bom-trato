import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  completeWorkOrder,
  getWorkOrder,
  getWorkOrderScheduleHistory,
  getWorkOrderStatusHistory,
  listWorkOrders,
  sendWorkOrderReviewInvitation,
} from '@/modules/workOrders/services/workOrder.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders';
const order = route + '/' + receivableId;

describe('work order service failure and review boundaries', () => {
  for (const [status, message] of [
    [400, /Confira os dados/],
    [403, /permissão/],
    [404, /não encontrada/],
    [409, /conflito de agenda/],
    [503, /ordens de serviço estão sendo atualizadas/],
    [500, /concluir a ordem/],
  ] as const) {
    it('preserves completion failure ' + status + ' without replaying the write', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(completeWorkOrder(organizationId, receivableId, 3), message);
      const requests = calls.filter((call) => call.path === order + '/complete');
      assert.equal(requests.length, 1);
      assert.deepEqual(JSON.parse(String(requests[0]?.body)), { version: 3 });
    });
  }

  const reads = [
    ['detail', () => getWorkOrder(organizationId, receivableId)],
    ['list', () => listWorkOrders(organizationId, { page: 1, status: 'ALL' })],
    ['status history', () => getWorkOrderStatusHistory(organizationId, receivableId, 3)],
    ['schedule history', () => getWorkOrderScheduleHistory(organizationId, receivableId, 3, 1)],
  ] as const;

  for (const [name, operation] of reads) {
    it('clears failed ' + name + ' reads and rejects malformed data', async (t) => {
      let attempt = 0;
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return ++attempt === 1 ? new Response(null, { status: 503 }) : success({ invalid: true });
      });
      await restoreSession();
      await assert.rejects(operation(), /atualizadas/);
      await assert.rejects(operation(), /interpretar/);
      assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 2);
    });

    it('surfaces expired authentication for ' + name + ' after one replay', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status: 401 });
      });
      await restoreSession();
      await assert.rejects(operation(), /sessão expirou/);
      assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 2);
    });
  }

  it('preserves all scoped list filters and omits unrestricted defaults', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ items: [], page: 1, hasMore: false });
    });
    await restoreSession();
    await listWorkOrders(organizationId, { page: 1, status: 'ALL' });
    await listWorkOrders(organizationId, {
      page: 1,
      limit: 5,
      status: 'SCHEDULED',
      customerId: receivableId,
      assignedToId: issuanceId,
    });
    const queries = calls
      .filter((call) => call.path.startsWith(route + '?'))
      .map((call) => new URLSearchParams(call.path.split('?')[1]));
    assert.deepEqual([...queries[0]!.keys()].sort(), ['limit', 'page']);
    assert.deepEqual(Object.fromEntries(queries[1]!), {
      page: '1',
      limit: '5',
      status: 'SCHEDULED',
      customerId: receivableId,
      assignedToId: issuanceId,
    });
  });

  for (const [code, message] of [
    ['CUSTOMER_CONTACT_REQUIRED', /não possui e-mail ou telefone/],
    ['REVIEW_PUBLIC_PROFILE_REQUIRED', /Publique o perfil/],
    ['REVIEW_ALREADY_SUBMITTED', /já foi avaliado/],
    ['REVIEW_RECIPIENT_NOT_ALLOWED', /não pode ser usado/],
    ['UNKNOWN', /não permite esta operação/],
  ] as const) {
    it('preserves the review invitation restriction ' + code, async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return Response.json({ error: { code } }, { status: 409 });
      });
      await restoreSession();
      await assert.rejects(sendWorkOrderReviewInvitation(organizationId, receivableId), message);
      assert.equal(calls.filter((call) => call.path.endsWith('/review-invitation')).length, 1);
    });
  }

  it('handles a malformed review conflict and rejects session expiry', async (t) => {
    let expired = false;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return expired ? new Response(null, { status: 401 }) : new Response('not JSON', { status: 409 });
    });
    await restoreSession();
    await assert.rejects(sendWorkOrderReviewInvitation(organizationId, receivableId), /não permite esta operação/);
    expired = true;
    await assert.rejects(sendWorkOrderReviewInvitation(organizationId, receivableId), /sessão expirou/);
    assert.equal(calls.filter((call) => call.path.endsWith('/review-invitation')).length, 3);
  });
});
