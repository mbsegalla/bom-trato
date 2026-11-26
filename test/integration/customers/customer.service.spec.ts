import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createCustomer, listCustomers } from '@/modules/customers/services/customer.service';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/customers';
const params = { page: 1, limit: 10, status: 'ACTIVE' as const };
const input = {
  name: 'Fixture customer',
  email: null,
  phone: '34999991234',
  defaultServiceAddress: null,
  notes: null
};

describe('customer HTTP service', () => {
  it('coalesces identical list requests but keeps organizations and search filters separate', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.includes('/customers?')) return success({ items: [], page: 1, hasMore: false });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    const first = listCustomers(organizationId, { ...params, search: ' Fixture ' });
    const duplicate = listCustomers(organizationId, { ...params, search: 'Fixture' });

    assert.strictEqual(first, duplicate);

    await Promise.all([
      first,
      duplicate,
      listCustomers(receivableId, { ...params, search: 'Fixture' }),
      listCustomers(organizationId, { ...params, search: 'Other' })
    ]);
    const customerRequests = calls.filter((call) => call.path.includes('/customers?'));

    assert.equal(customerRequests.length, 3);
    assert.ok(customerRequests.some((call) => call.path.startsWith(route + '?') && call.path.includes('search=Fixture')));
    assert.ok(customerRequests.some((call) => call.path.includes(receivableId + '/customers?')));
    assert.ok(customerRequests.some((call) => call.path.includes('search=Other')));
  });

  it('clears failed list flights and retries only on a new explicit request', async (t) => {
    let attempts = 0;
    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route + '?')) return ++attempts === 1 ? new Response(null, { status: 503 }) : success({
        items: [],
        page: 1,
        hasMore: false
      });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(listCustomers(organizationId, params), /atualizados/);
    assert.equal(attempts, 1);
    assert.deepEqual(await listCustomers(organizationId, params), { items: [], page: 1, hasMore: false });
    assert.equal(attempts, 2);
  });

  it('sends a scoped creation and reports email conflicts without repeating the mutation', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) return new Response(null, { status: 409 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(createCustomer(organizationId, input), /cliente com este e-mail/);

    const requests = calls.filter((call) => call.path === route);

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0].body)), input);
  });
});
