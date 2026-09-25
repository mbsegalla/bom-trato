import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const emailSchema = z.string().trim().email().max(254);

export const actionTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const emailVerificationTokenSchema = actionTokenSchema;

export const passwordResetTokenSchema = actionTokenSchema;

export const resendVerificationEmailSchema = emailSchema;

export const csrfResponseSchema = apiResponseSchema(
  z.object({
    csrfToken: z.string().min(1),
  }),
);

export const sessionResponseSchema = apiResponseSchema(
  z.object({
    accessToken: z.string().min(1),
    expiresIn: z.number().positive(),
    tokenType: z.literal('Bearer'),
    csrfToken: z.string().min(1),
  }),
);

export const currentUserResponseSchema = apiResponseSchema(
  z.object({
    id: z.uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    emailVerified: z.boolean(),
    selectedPlanPriceId: z.uuid().nullable(),
  }),
);

export const authSessionSchema = z.object({
  id: z.uuid(),
  createdAt: z.coerce.date(),
  lastRefreshedAt: z.coerce.date(),
  absoluteExpiresAt: z.coerce.date(),
  userAgent: z.string().nullable(),
  current: z.boolean(),
});

export const authSessionsResponseSchema = apiResponseSchema(z.array(authSessionSchema));
