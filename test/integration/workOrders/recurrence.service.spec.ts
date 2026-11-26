import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getWorkOrderRecurrence,
  listWorkOrderRecurrences,
  saveWorkOrderRecurrence,
} from '@/modules/workOrders/services/workOrderRecurrence.service';
import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/work-orders/' + receivableId + '/recurrence';
const listRoute = '/api/organizations/' + organizationId + '/work-order-recurrences';
const input = {
  intervalUnit: 'MONTH' as const,
  intervalCount: 1,
  nextVisitOn: '2030-01-15',
  enabled: true,
  autoGenerateEnabled: false,
};
const recurrence = { ...input, version: 2, lastGeneratedQuoteId: null, lastGeneratedVisitOn: null };
const view = { recurrence, canConfigure: true, customerArchived: false, today: '2030-01-01', completedOn: '2029-12-15' };

describe('work order recurrence HTTP contracts', () => {
  it('sends a scoped recurrence update with its current version and calendar date', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return success(view);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.deepEqual(await getWorkOrderRecurrence(organizationId, receivableId), view);
    assert.deepEqual(await saveWorkOrderRecurrence(organizationId, receivableId, 1, input), view);

    const requests = calls.filter((call) => call.path === route);

    assert.deepEqual(requests.map((call) => call.method), ['GET', 'PUT']);
    assert.deepEqual(JSON.parse(String(requests[1]?.body)), { ...input, version: 1 });
  });

  it('rejects frequency and calendar-date violations before contacting the API', async (t) => {
    const calls = mockHttp(t, () => { throw new Error('Unexpected request'); });

    for (const invalid of [
      { ...input, intervalCount: 13 },
      { ...input, intervalUnit: 'WEEK' as const, intervalCount: 53 },
      { ...input, intervalCount: 0 },
      { ...input, nextVisitOn: '2030-02-30' },
    ]) {
      await assert.rejects(saveWorkOrderRecurrence(organizationId, receivableId, 1, invalid));
    }

    assert.equal(calls.length, 0);
  });

  it('preserves explicit status, visit-period and trimmed customer search filters across pages', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(listRoute + '?')) {
        return success({
          items: [{ workOrderId: receivableId, title: 'Fixture', customerId: issuanceId, customerName: 'Cliente', customerArchived: false, recurrence }],
          page: 2, hasMore: true, today: view.today, canConfigure: true,
        });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const result = await listWorkOrderRecurrences(organizationId, {
      page: 2, limit: 5, status: 'ACTIVE', visit: 'NEXT_SEVEN_DAYS', customerName: '  Cliente & Cia  ',
    });

    assert.equal(result.items[0]?.recurrence.nextVisitOn, input.nextVisitOn);
    assert.equal(result.hasMore, true);

    const request = calls.find((call) => call.path.startsWith(listRoute + '?'))!;
    const query = new URLSearchParams(request.path.split('?')[1]);

    assert.deepEqual(Object.fromEntries(query), {
      page: '2', limit: '5', status: 'ACTIVE', visit: 'NEXT_SEVEN_DAYS', customerName: 'Cliente & Cia',
    });
  });

  it('distinguishes stale changes, permission failures and malformed recurrence responses', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 409 });
        if (attempt === 2) return new Response(null, { status: 403 });

        return success({ ...view, recurrence: { ...recurrence, intervalCount: 13 } });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(saveWorkOrderRecurrence(organizationId, receivableId, 1, input), /configuração foi alterada/);
    await assert.rejects(getWorkOrderRecurrence(organizationId, receivableId), /permissão/);
    await assert.rejects(getWorkOrderRecurrence(organizationId, receivableId), /interpretar/);
    assert.equal(calls.filter((call) => call.path === route).length, 3);
  });
  for (const [status, message] of [
    [400, /frequência e a data/], [404, /não encontrada/], [503, /recorrência está indisponível/], [500, /consultar ou salvar/],
  ] as const) {
    it('preserves recurrence failure ' + status + ' without replaying the save', async (t) => {
      const calls = mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(saveWorkOrderRecurrence(organizationId, receivableId, 1, input), message);
      assert.equal(calls.filter((call) => call.path === route).length, 1);
    });
  }

  it('omits unrestricted filters and defaults the pagination limit', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ items: [], page: 1, hasMore: false, today: view.today, canConfigure: false });
    });
    await restoreSession();
    assert.equal((await listWorkOrderRecurrences(organizationId, { page: 1, status: 'ALL', visit: 'ALL', customerName: ' ' })).canConfigure, false);
    const query = new URLSearchParams(calls.find((call) => call.path.startsWith(listRoute))!.path.split('?')[1]);
    assert.deepEqual([...query.keys()].sort(), ['limit', 'page']);
    assert.ok(Number(query.get('limit')) > 0);
  });

  for (const [status, message] of [[403, /permissão/], [503, /carregar os serviços recorrentes/]] as const) {
    it('rejects recurrence listing HTTP ' + status, async (t) => {
      mockHttp(t, (call) => {
        if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
        if (call.path === '/api/auth/refresh') return sessionResponse();
        return new Response(null, { status });
      });
      await restoreSession();
      await assert.rejects(listWorkOrderRecurrences(organizationId, { page: 1, status: 'ALL', visit: 'ALL', customerName: '' }), message);
    });
  }

  it('rejects a malformed recurrence list and allows explicit recovery', async (t) => {
    let attempt = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return ++attempt === 1 ? success({ items: null }) : success({ items: [], page: 1, hasMore: false, today: view.today, canConfigure: true });
    });
    await restoreSession();
    const params = { page: 1, status: 'ALL' as const, visit: 'ALL' as const, customerName: '' };
    await assert.rejects(listWorkOrderRecurrences(organizationId, params), /interpretar/);
    assert.deepEqual((await listWorkOrderRecurrences(organizationId, params)).items, []);
  });
});
