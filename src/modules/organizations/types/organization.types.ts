import type { z } from 'zod';

import type { joinedOrganizationSchema, organizationRoleSchema } from '../schemas/organization.schema';

export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

export type JoinedOrganization = z.infer<typeof joinedOrganizationSchema>;
