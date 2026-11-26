import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import {
  getTeamEntitlements,
  listOrganizationInvitations,
  previewOrganizationInvitation,
  resendOrganizationInvitation,
  revokeOrganizationInvitation,
  TeamRequestError,
} from '@/modules/settings/services/team.service';

import { mockHttp, organizationId, receivableId, issuanceId, sessionResponse, success } from '../../support/http.fixture';

const route = '/api/organizations/' + organizationId + '/invitations';
const date = '2025-01-01T00:00:00.000Z';
const invitation = {
  id: receivableId,
  organizationId,
  email: 'member@example.invalid',
  status: 'PENDING',
  expiresAt: date,
  lastSentAt: date,
  acceptedAt: null,
  revokedAt: null,
  createdAt: date,
};
const failure = (code: string, status: number) => Response.json({ statusCode: status, success: false, error: { code, message: 'Fixture' } }, { status });

describe('team invitation and entitlement contracts', () => {
  it('collects all invitation pages in order and coalesces requests for the same organization', async (t) => {
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.startsWith(route + '?')) {
        const page = Number(new URLSearchParams(call.path.split('?')[1]).get('page'));
        return success({ page, hasMore: page === 1, items: [{ ...invitation, id: page === 1 ? receivableId : issuanceId }] });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    const first = listOrganizationInvitations(organizationId);
    const duplicate = listOrganizationInvitations(organizationId);

    assert.strictEqual(first, duplicate);

    const result = await first;

    assert.deepEqual(result.map((item) => item.id), [receivableId, issuanceId]);
    assert.deepEqual(result[0]?.expiresAt, new Date(date));
    assert.equal(calls.filter((call) => call.path.startsWith(route + '?')).length, 2);
  });

  it('reads plan limits without mixing organizations and rejects invalid entitlements', async (t) => {
    let attempt = 0;

    mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/billing/entitlements')) {
        attempt++;
        const sameOrg = call.path.includes('/' + organizationId + '/');
        return success({
          hasAccess: true,
          maxUsers: attempt === 1 ? -1 : sameOrg ? 3 : 5,
          memberCount: 1,
          teamManagementEnabled: true,
          canAddMember: true,
        });
      }
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    await assert.rejects(getTeamEntitlements(organizationId), /interpretar/);

    const first = getTeamEntitlements(organizationId);
    const duplicate = getTeamEntitlements(organizationId);
    const other = getTeamEntitlements(issuanceId);

    assert.strictEqual(first, duplicate);
    assert.notStrictEqual(first, other);

    assert.deepEqual((await Promise.all([first, other])).map((item) => item.maxUsers), [3, 5]);
  });

  it('previews tokens only in the body, resends scoped invitations and preserves rate-limit errors', async (t) => {
    const token = 'a'.repeat(43);
    let resend = 0;

    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path === '/api/organization-invitations/preview') return success({
        id: receivableId, organization: { id: organizationId, name: 'Fixture' }, expiresAt: date,
      });
      if (call.path === route + '/' + receivableId + '/resend') {
        return ++resend === 1 ? success({ invitation, emailQueued: true }) : failure('INVITATION_RATE_LIMITED', 429);
      }
      if (call.path === route + '/' + receivableId && call.method === 'DELETE') return new Response(null, { status: 204 });
      throw new Error('Unexpected request: ' + call.path);
    });

    await restoreSession();

    assert.equal((await previewOrganizationInvitation(token)).organization.id, organizationId);
    assert.equal((await resendOrganizationInvitation(organizationId, receivableId)).emailQueued, true);
    await assert.rejects(resendOrganizationInvitation(organizationId, receivableId), (error: unknown) =>
      error instanceof TeamRequestError && error.code === 'INVITATION_RATE_LIMITED' && error.status === 429,
    );
    await revokeOrganizationInvitation(organizationId, receivableId);

    const preview = calls.find((call) => call.path === '/api/organization-invitations/preview');

    assert.deepEqual(JSON.parse(String(preview?.body)), { token });
    assert.equal(preview?.method, 'POST');
    assert.equal(resend, 2);
    assert.equal(calls.at(-1)?.method, 'DELETE');
  });
});
