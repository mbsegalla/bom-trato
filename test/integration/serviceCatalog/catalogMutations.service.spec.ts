import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { archiveCatalogService, getCatalogService, restoreCatalogService, updateCatalogService } from '@/modules/serviceCatalog/services/catalogService.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/services/' + receivableId;
const date = '2025-01-01T00:00:00.000Z';
const input = {
  name: 'Fixture service',
  description: null,
  unit: 'SERVICE' as const,
  amountInCents: 1500,
  estimatedDurationMinutes: 60,
};
const item = { ...input, id: receivableId, organizationId, currency: 'brl', archivedAt: null, createdAt: date, updatedAt: date };

describe('catalog detail and mutation contracts', () => {
  it('updates, archives and restores the scoped service preserving integer amounts', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route + '/archive') return success({ ...item, archivedAt: date });
      if (call.path === route || call.path === route + '/restore') return success(item);
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await updateCatalogService(organizationId, receivableId, input)).amountInCents, 1500);
    assert.deepEqual((await archiveCatalogService(organizationId, receivableId)).archivedAt, new Date(date));
    assert.equal((await restoreCatalogService(organizationId, receivableId)).archivedAt, null);

    const requests = calls.filter((call) => call.path.startsWith(route));

    assert.deepEqual(requests.map((call) => [call.path, call.method]), [
      [route, 'PATCH'], [route + '/archive', 'POST'], [route + '/restore', 'POST'],
    ]);
    assert.deepEqual(JSON.parse(String(requests[0]?.body)), input);
  });

  it('deduplicates detail reads but separates organizations', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/services/' + receivableId)) return success({ ...item, organizationId: call.path.split('/')[3] });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = getCatalogService(organizationId, receivableId);
    const duplicate = getCatalogService(organizationId, receivableId);
    const other = getCatalogService(issuanceId, receivableId);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);

    const [result, otherResult] = await Promise.all([first, other]);

    assert.equal(result.organizationId, organizationId);
    assert.equal(otherResult.organizationId, issuanceId);
    assert.equal(calls.filter((call) => call.path.endsWith('/services/' + receivableId)).length, 2);
  });

  it('reports a missing service and permits a new explicit read after a failure', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === route) {
        attempt++;
        return attempt === 1 ? new Response(null, { status: 404 }) : success(item);
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getCatalogService(organizationId, receivableId), /não encontrado/);
    assert.equal((await getCatalogService(organizationId, receivableId)).id, receivableId);
    assert.equal(attempt, 2);
  });
});
