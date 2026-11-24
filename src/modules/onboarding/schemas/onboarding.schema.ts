import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const onboardingStepSchema = z.enum([
  'PROVISIONING',
  'SELECT_PLAN',
  'PAYMENT',
  'PAYMENT_PENDING',
  'BILLING_REQUIRED',
  'BILLING_REVIEW',
  'CREATE_BUSINESS',
  'APP',
  'CONTACT_OWNER',
]);

export const onboardingOrganizationIdSchema = z.uuid();

export const onboardingAccessSourceSchema = z.enum(['SUBSCRIPTION', 'TRIAL', 'NONE']);

export const onboardingTrialSchema = z.object({
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  convertedAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),
  remainingDays: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const onboardingStateSchema = apiResponseSchema(
  z.object({
    step: onboardingStepSchema,
    organizationId: onboardingOrganizationIdSchema.nullable(),
    selectedPlanPriceId: z.uuid().nullable(),
    accessSource: onboardingAccessSourceSchema,
    trialEligible: z.boolean(),
    trial: onboardingTrialSchema.nullable(),
  }),
);
