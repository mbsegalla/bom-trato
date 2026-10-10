import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const reviewInvitationPreviewSchema = z.object({
  businessName: z.string(),
  logoUrl: z.url().nullable(),
  professionalSlug: z.string(),
  workOrderTitle: z.string(),
  reviewerDisplayName: z.string(),
  expiresAt: z.coerce.date(),
});

export const submittedReviewSchema = z.object({
  reviewerDisplayName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
  verified: z.boolean(),
  professionalSlug: z.string(),
});

export const reviewInvitationPreviewResponseSchema = apiResponseSchema(reviewInvitationPreviewSchema);

export const submittedReviewResponseSchema = apiResponseSchema(submittedReviewSchema);
