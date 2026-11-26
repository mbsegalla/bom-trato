import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { restoreSession } from '@/modules/auth/services/session.service';
import { acceptOrganizationInvitation, inviteOrganizationMember, removeOrganizationMember, TeamRequestError } from '@/modules/settings/services/team.service';
import { mockHttp, organizationId, receivableId, sessionResponse, success } from '../../support/http.fixture';
const failure = (code: string, status: number) => Response.json({ statusCode: status, success: false, error: { code, message: 'Fixture' } }, { status });

describe('team HTTP safeguards', () => {
  it('preserves exact domain conflicts and never retries an invitation implicitly', async (t) => {
    let code = 'MEMBER_LIMIT_REACHED';
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      return failure(code, 409);
    });
    await restoreSession();
    for (const expected of ['MEMBER_LIMIT_REACHED', 'INVITATION_ALREADY_PENDING']) {
      code = expected;
      await assert.rejects(inviteOrganizationMember(organizationId, 'member@example.invalid'), (e: unknown) => e instanceof TeamRequestError && e.status === 409 && e.code === expected);
    }
    const posts = calls.filter((call) => call.path.endsWith('/invitations'));
    assert.equal(posts.length, 2);
    assert.deepEqual(JSON.parse(String(posts[0]?.body)), { email: 'member@example.invalid' });
  });
  it('submits a private invitation token only in the body and rejects owner removal', async (t) => {
    const token = 'a'.repeat(43);
    const calls = mockHttp(t, (call) => {
      if (call.path === '/api/auth/csrf') return success({ csrfToken: 'fixture-csrf' });
      if (call.path === '/api/auth/refresh') return sessionResponse();
      if (call.path.endsWith('/accept')) return success({ organizationId });
      return failure('OWNER_REMOVAL_FORBIDDEN', 403);
    });
    await restoreSession();
    assert.deepEqual(await acceptOrganizationInvitation(token), { organizationId });
    await assert.rejects(removeOrganizationMember(organizationId, receivableId), (e: unknown) => e instanceof TeamRequestError && e.code === 'OWNER_REMOVAL_FORBIDDEN');
    const accepted = calls.find((call) => call.path === '/api/organization-invitations/accept');
    assert.deepEqual(JSON.parse(String(accepted?.body)), { token });
    assert.equal(calls.at(-1)?.method, 'DELETE');
  });
});
