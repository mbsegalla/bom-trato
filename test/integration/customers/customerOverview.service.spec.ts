import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { getCustomerOverview } from '@/modules/customers/services/customer.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const date = '2025-01-01T00:00:00.000Z';
const overview = {
  customer: {
    id: receivableId,
    organizationId,
    name: 'Fixture customer',
    email: null,
    phone: '34999991234',
    defaultServiceAddress: null,
    notes: null,
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
  },
  summary: {
    quoteCount: 2,
    workOrderCount: 1,
    completedWorkOrderCount: 1,
    pendingAmountInCents: 100,
    overdueAmountInCents: 0,
    receivedAmountInCents: 500,
    currency: 'brl',
  },
  generatedAt: date,
};

describe('customer overview contracts', () => {
  it('coalesces identical requests but isolates organizations and converts timestamps', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/overview')) {
        const org = call.path.split('/')[3];
        return success({ ...overview, customer: { ...overview.customer, organizationId: org } });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getCustomerOverview(organizationId, receivableId);
    const duplicate = getCustomerOverview(organizationId, receivableId);
    const other = getCustomerOverview(receivableId, receivableId);

    assert.strictEqual(first, duplicate);
    const [result, otherResult] = await Promise.all([first, other]);

    assert.equal(result.customer.organizationId, organizationId);
    assert.equal(otherResult.customer.organizationId, receivableId);
    assert.deepEqual(result.generatedAt, new Date(date));
    assert.equal(result.summary.receivedAmountInCents, 500);
    assert.equal(calls.filter((call) => call.path.endsWith('/overview')).length, 2);
  });

  it('clears a rejected flight and rejects invalid financial totals', async (t) => {
    let attempts = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/overview')) {
        attempts++;
        if (attempts === 1) return new Response(null, { status: 503 });
        if (attempts === 2)
          return success({ ...overview, summary: { ...overview.summary, receivedAmountInCents: -1 } });
        return success(overview);
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getCustomerOverview(organizationId, receivableId), /atualizados/);
    await assert.rejects(getCustomerOverview(organizationId, receivableId), /interpretar/);
    assert.equal((await getCustomerOverview(organizationId, receivableId)).summary.quoteCount, 2);
    assert.equal(attempts, 3);
  });
});
