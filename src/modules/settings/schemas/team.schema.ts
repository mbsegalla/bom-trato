import { z } from 'zod';

import { organizationMemberSchema } from '@/modules/organizations/schemas/organization.schema';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const organizationInvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED']);

export const organizationInvitationSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  email: z.string().email(),
  status: organizationInvitationStatusSchema,
  expiresAt: z.coerce.date(),
  lastSentAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const organizationInvitationsResponseSchema = apiResponseSchema(
  z.object({
    page: z.number().int().positive(),
    hasMore: z.boolean(),
    items: z.array(organizationInvitationSchema),
  }),
);

export const sendInvitationResponseSchema = apiResponseSchema(
  z.object({
    invitation: organizationInvitationSchema,
    emailQueued: z.boolean(),
  }),
);

export const teamEntitlementsResponseSchema = apiResponseSchema(
  z.object({
    hasAccess: z.boolean(),
    maxUsers: z.number().int().nonnegative(),
    memberCount: z.number().int().nonnegative(),
    teamManagementEnabled: z.boolean(),
    canAddMember: z.boolean(),
  }),
);

export const teamMembersPageSchema = z.object({
  page: z.number().int().positive(),
  hasMore: z.boolean(),
  items: z.array(organizationMemberSchema),
});

export const organizationInvitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const previewOrganizationInvitationResponseSchema = apiResponseSchema(
  z.object({
    id: z.uuid(),
    organization: z.object({
      id: z.uuid(),
      name: z.string().min(1),
    }),
    expiresAt: z.coerce.date(),
  }),
);

export const acceptOrganizationInvitationResponseSchema = apiResponseSchema(
  z.object({
    organizationId: z.uuid(),
  }),
);

export const inviteMemberFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .email('Informe um e-mail válido.')
    .max(254, 'O e-mail deve ter no máximo 254 caracteres.'),
});

export const apiErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});
