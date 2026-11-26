import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const verifiedStatusSchema = z.enum([
  'VERIFIED_PENDING',
  'VERIFIED_APPROVED',
  'VERIFIED_CLOSED',
  'VERIFIED_REFUNDED',
  'VERIFIED_REVIEW_REQUIRED',
]);

export const sandboxPixRecoveryStatusSchema = z.enum([
  'IN_PROGRESS',
  'ABANDONED',
  'NOT_FOUND',
  'AMBIGUOUS',
  'INVALID_PROVIDER_PAYMENT',
  'PROVIDER_UNAVAILABLE',
  'CONNECTION_CHANGED',
  'BINDING_CONFLICT',
  'VERIFIED_PENDING',
  'VERIFIED_APPROVED',
  'VERIFIED_CLOSED',
  'VERIFIED_REFUNDED',
  'VERIFIED_REVIEW_REQUIRED',
]);

const dateSchema = z.iso.datetime().transform((value) => new Date(value));

const lastAttemptSchema = z
  .object({
    status: sandboxPixRecoveryStatusSchema,
    startedAt: dateSchema,
    completedAt: dateSchema.nullable(),
    paymentId: z
      .string()
      .regex(/^[1-9]\d{0,29}$/)
      .nullable(),
  })
  .refine((attempt) => verifiedStatusSchema.safeParse(attempt.status).success === (attempt.paymentId !== null));

export const receivableSandboxPixRecoverySchema = z
  .object({
    organizationId: z.uuid(),
    receivableId: z.uuid(),
    issuanceId: z.uuid().nullable(),
    canRecover: z.boolean(),
    nextRecoveryAt: dateSchema.nullable(),
    lastAttempt: lastAttemptSchema.nullable(),
    lastWebhook: z
      .object({
        status: verifiedStatusSchema,
        receivedAt: dateSchema,
      })
      .nullable(),
  })
  .refine(
    (review) =>
      review.issuanceId !== null ||
      (!review.canRecover &&
        review.nextRecoveryAt === null &&
        review.lastAttempt === null &&
        review.lastWebhook === null),
  );

export const receivableSandboxPixRecoveryResponseSchema = apiResponseSchema(receivableSandboxPixRecoverySchema);
