import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  invalidateOrganizationMembers,
  listJoinedOrganizations,
  listOrganizationMembers,
} from '@/modules/organizations/services/organization.service';

import {
  issuanceId,
  mockHttp,
  organizationId,
  receivableId,
  sessionResponse,
  success,
} from '../../support/http.fixture';

describe('organization HTTP service', () => {
  it('deduplicates joined-organization requests and loads each page exactly once', async (t) => {
    const first = {
      id: organizationId,
      name: 'First',
      logoUrl: null,
      role: 'OWNER',
    };
    const second = {
      id: receivableId,
      name: 'Second',
      logoUrl: null,
      role: 'MEMBER',
    };
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/organizations/mine?page=1&limit=100')
        return success({
          page: 1,
          hasMore: true,
          items: [first],
        });
      if (call.path === '/api/organizations/mine?page=2&limit=100')
        return success({
          page: 2,
          hasMore: false,
          items: [second],
        });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();
    const request = listJoinedOrganizations();

    assert.strictEqual(request, listJoinedOrganizations());
    assert.deepEqual(await request, [first, second]);
    assert.equal(calls.filter((call) => call.path.startsWith('/api/organizations/mine')).length, 2);
  });

  it('keeps cached member data isolated by organization and expires it after five minutes', async (t) => {
    invalidateOrganizationMembers(organizationId);
    invalidateOrganizationMembers(receivableId);
    let now = Date.now();
    t.mock.method(Date, 'now', () => now);
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      const org = call.path.includes(organizationId) ? organizationId : receivableId;

      return success({
        page: 1,
        hasMore: false,
        items: [
          {
            id: issuanceId,
            userId: org,
            role: 'OWNER',
            createdAt: '2026-01-01T00:00:00Z',
            user: { name: org },
          },
        ],
      });
    });

    await restoreSession();
    const first = listOrganizationMembers(organizationId);

    assert.strictEqual(first, listOrganizationMembers(organizationId));

    const [a, b] = await Promise.all([first, listOrganizationMembers(receivableId)]);

    assert.equal(a[0].userId, organizationId);
    assert.equal(b[0].userId, receivableId);

    await listOrganizationMembers(organizationId);

    assert.equal(calls.filter((call) => call.path.includes('/members?')).length, 2);

    invalidateOrganizationMembers(organizationId);

    await listOrganizationMembers(organizationId);
    await listOrganizationMembers(receivableId);

    assert.equal(calls.filter((call) => call.path.includes('/members?')).length, 3);

    now += 300001;

    await listOrganizationMembers(receivableId);

    assert.equal(calls.filter((call) => call.path.includes('/members?')).length, 4);
  });
});
