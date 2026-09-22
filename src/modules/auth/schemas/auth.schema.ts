import { z } from 'zod';

export const csrfResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    csrfToken: z.string().min(1),
  }),
});

export const emailVerificationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

export const resendVerificationEmailSchema = z.string().trim().email().max(254);
