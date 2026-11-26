import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { archiveCustomer, restoreCustomer, updateCustomer } from '@/modules/customers/services/customer.service';

import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';

const route = `/api/organizations/${organizationId}/customers/${receivableId}`;
const date = '2025-01-01T00:00:00.000Z';
const input = {
  name: 'Fixture customer',
  email: null,
  phone: '34999991234',
  defaultServiceAddress: null,
  notes: null,
};
const customer = {
  ...input,
  id: receivableId,
  organizationId,
  archivedAt: null,
  createdAt: date,
  updatedAt: date,
};

describe('customer mutation contracts', () => {
  it('updates, archives and restores a customer with the scoped URL and expected HTTP methods', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route || call.path === route + '/restore') return success(customer);
      if (call.path === route + '/archive') return success({ ...customer, archivedAt: date });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await updateCustomer(organizationId, receivableId, input)).name, input.name);
    assert.deepEqual((await archiveCustomer(organizationId, receivableId)).archivedAt, new Date(date));
    assert.equal((await restoreCustomer(organizationId, receivableId)).archivedAt, null);

    const mutations = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(
      mutations.map((call) => [call.path, call.method]),
      [
        [route, 'PATCH'],
        [route + '/archive', 'POST'],
        [route + '/restore', 'POST'],
      ],
    );
    assert.deepEqual(JSON.parse(String(mutations[0].body)), input);
    assert.ok(mutations.every((call) => call.headers.has('Authorization')));
  });

  it('rejects invalid and unauthorized responses without repeating customer mutations', async (t) => {
    let attempt = 0;
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route)) {
        attempt++;
        if (attempt === 1) return new Response(null, { status: 403 });
        if (attempt === 2) return new Response(null, { status: 404 });
        return success({ id: 'invalid' });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(updateCustomer(organizationId, receivableId, input), /permissão/);
    await assert.rejects(archiveCustomer(organizationId, receivableId), /não encontrado/);
    await assert.rejects(restoreCustomer(organizationId, receivableId), /interpretar/);

    assert.equal(calls.filter((call) => call.path.startsWith(route)).length, 3);
  });
});
