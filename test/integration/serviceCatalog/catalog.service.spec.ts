import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { createCatalogService, listCatalogServices } from '@/modules/serviceCatalog/services/catalogService.service';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';
describe('catalog service HTTP boundary', () => {
  it('coalesces identical catalog queries but not different tenant or archive filters', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ items: [], page: 1, hasMore: false });
    });
    await restoreSession();
    const params = { page: 1, limit: 10, status: 'ACTIVE' as const };
    const first = listCatalogServices(organizationId, { ...params, search: ' Fixture ' });
    assert.strictEqual(first, listCatalogServices(organizationId, { ...params, search: 'Fixture' }));
    await Promise.all([first, listCatalogServices(receivableId, params), listCatalogServices(organizationId, { ...params, status: 'ARCHIVED' })]);
    assert.equal(calls.filter((call) => call.path.includes('/services?')).length, 3);
  });
  it('sends integer cents and refuses a malformed mutation result', async (t) => {
    const input = { name: 'Fixture service', description: null, unit: 'SERVICE' as const, amountInCents: 1001, estimatedDurationMinutes: null };
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return success({ id: 'malformed' });
    });
    await restoreSession();
    await assert.rejects(createCatalogService(organizationId, input), /interpretar/);
    const posts = calls.filter((call) => call.path === '/api/organizations/' + organizationId + '/services');
    assert.equal(posts.length, 1);
    assert.deepEqual(JSON.parse(String(posts[0]?.body)), input);
  });
});
