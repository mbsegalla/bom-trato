import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const csrfResponseSchema = apiResponseSchema(
  z.object({
    csrfToken: z.string().min(1),
  }),
);

export const emailSchema = z.string().trim().email().max(254);

export const actionTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const emailVerificationTokenSchema = actionTokenSchema;

export const passwordResetTokenSchema = actionTokenSchema;

export const resendVerificationEmailSchema = emailSchema;
