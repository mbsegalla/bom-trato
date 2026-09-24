import type { z } from 'zod';

import type { OrganizationMember } from '@/modules/organizations/types/organization.types';

import type {
  acceptOrganizationInvitationResponseSchema,
  inviteMemberFormSchema,
  organizationInvitationSchema,
  organizationInvitationStatusSchema,
  previewOrganizationInvitationResponseSchema,
  sendInvitationResponseSchema,
  teamEntitlementsResponseSchema,
} from '../schemas/team.schema';

export type OrganizationInvitationStatus = z.infer<typeof organizationInvitationStatusSchema>;

export type OrganizationInvitation = z.infer<typeof organizationInvitationSchema>;

export type TeamEntitlements = z.infer<typeof teamEntitlementsResponseSchema>;

export type SendInvitationResult = z.infer<typeof sendInvitationResponseSchema>;

export type PreviewOrganizationInvitation = z.infer<typeof previewOrganizationInvitationResponseSchema>;

export type AcceptOrganizationInvitationResult = z.infer<typeof acceptOrganizationInvitationResponseSchema>;

export type InviteMemberInput = z.output<typeof inviteMemberFormSchema>;

export interface TeamData {
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  entitlements: TeamEntitlements;
}
