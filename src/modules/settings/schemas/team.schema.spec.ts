import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  inviteMemberFormSchema,
  organizationInvitationTokenSchema,
  teamEntitlementsResponseSchema
} from './team.schema';

describe('team invitation and entitlement contract', () => {
  it('validates invitation addresses and private token length', () => {
    assert.deepEqual(
      inviteMemberFormSchema.parse({ email: ' person@example.invalid ' }),
      { email: 'person@example.invalid' }
    );
    assert.equal(inviteMemberFormSchema.safeParse({ email: 'bad' }).success, false);
    assert.equal(organizationInvitationTokenSchema.safeParse('a'.repeat(43)).success, true);
    assert.equal(organizationInvitationTokenSchema.safeParse('a'.repeat(42)).success, false);
  });

  it('rejects negative member counts', () => {
    const data = {
      hasAccess: true,
      maxUsers: 3,
      memberCount: 2,
      teamManagementEnabled: true,
      canAddMember: true
    };

    assert.deepEqual(teamEntitlementsResponseSchema.parse({ statusCode: 200, success: true, data }), data);
    assert.equal(
      teamEntitlementsResponseSchema.safeParse({
        statusCode: 200,
        success: true,
        data: { ...data, memberCount: -1 }
      }).success,
      false
    );
  });
});
