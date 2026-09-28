import type { z } from 'zod';

import type {
  reviewInvitationPreviewSchema,
  reviewInvitationSchema,
  submittedReviewSchema,
} from '../schemas/review.schema';

export type ReviewInvitation = z.infer<typeof reviewInvitationSchema>;

export type ReviewInvitationPreview = z.infer<typeof reviewInvitationPreviewSchema>;

export type SubmittedReview = z.infer<typeof submittedReviewSchema>;
