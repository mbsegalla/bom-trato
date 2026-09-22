import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const csrfResponseSchema = apiResponseSchema(
  z.object({
    csrfToken: z.string().min(1),
  }),
);

export const emailVerificationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const resendVerificationEmailSchema = z.string().trim().email().max(254);
