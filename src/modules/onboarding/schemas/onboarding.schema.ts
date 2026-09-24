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

export const onboardingStateSchema = apiResponseSchema(
  z.object({
    step: onboardingStepSchema,
    organizationId: onboardingOrganizationIdSchema.nullable(),
    selectedPlanPriceId: z.uuid().nullable(),
  }),
);
