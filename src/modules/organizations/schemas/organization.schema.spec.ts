import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { joinedOrganizationsResponseSchema, organizationMemberSchema } from './organization.schema';

describe('organization scope contract', () => {
  const id = '11111111-1111-4111-8111-111111111111';

  it('requires recognized membership roles and valid pagination', () => {
    const data = {
      page: 1,
      hasMore: false,
      items: [{
        id,
        name: 'Empresa',
        logoUrl: null,
        role: 'OWNER'
      }]
    };

    assert.equal(joinedOrganizationsResponseSchema.safeParse({ statusCode: 200, success: true, data }).success, true);
    assert.equal(
      joinedOrganizationsResponseSchema.safeParse({
        statusCode: 200,
        success: true,
        data: { ...data, page: 0 }
      }).success,
      false
    );
    assert.equal(
      joinedOrganizationsResponseSchema.safeParse({
        statusCode: 200,
        success: true,
        data: {
          ...data,
          items: [{ ...data.items[0], role: 'ADMIN' }]
        }
      }).success,
      false
    );
  });

  it('omits private user information from member projections', () => {
    const member = organizationMemberSchema.parse({
      id,
      userId: id,
      role: 'MEMBER',
      createdAt: '2026-01-01T00:00:00Z',
      user: {
        name: 'Member',
        passwordHash: 'private'
      }
    });

    assert.deepEqual(member.user, { name: 'Member' });
  });
});
