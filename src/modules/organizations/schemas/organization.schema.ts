import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const organizationRoleSchema = z.enum(['OWNER', 'MEMBER']);

export const joinedOrganizationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  role: organizationRoleSchema,
});

export const joinedOrganizationsResponseSchema = apiResponseSchema(
  z.object({
    page: z.number().int().positive(),
    hasMore: z.boolean(),
    items: z.array(joinedOrganizationSchema),
  }),
);
