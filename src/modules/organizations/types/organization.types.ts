import type { z } from 'zod';

import type {
  joinedOrganizationSchema,
  organizationMemberSchema,
  organizationRoleSchema,
} from '../schemas/organization.schema';

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export type JoinedOrganization = z.infer<typeof joinedOrganizationSchema>;

export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
