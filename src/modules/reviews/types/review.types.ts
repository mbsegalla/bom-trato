import type { z } from 'zod';

import type { reviewInvitationPreviewSchema, submittedReviewSchema } from '../schemas/review.schema';

export type ReviewInvitationPreview = z.infer<typeof reviewInvitationPreviewSchema>;

export type SubmittedReview = z.infer<typeof submittedReviewSchema>;
