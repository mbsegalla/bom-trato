import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const subscriptionStatusSchema = z.enum([
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'PAUSED',
]);

export const billingSubscriptionSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  planPriceId: z.uuid(),
  status: subscriptionStatusSchema,
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  paidThrough: z.coerce.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasAccess: z.boolean(),
});

export const billingSubscriptionResponseSchema = apiResponseSchema(billingSubscriptionSchema.nullable());

export const billingEntitlementsSchema = z.object({
  hasAccess: z.boolean(),
  maxUsers: z.number().int().nonnegative(),
  memberCount: z.number().int().nonnegative(),
  teamManagementEnabled: z.boolean(),
  canAddMember: z.boolean(),
});

export const billingEntitlementsResponseSchema = apiResponseSchema(billingEntitlementsSchema);

export const billingCardSchema = z.object({
  brand: z.string().min(1),
  last4: z.string().regex(/^\d{4}$/),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().positive(),
});

export const billingCardResponseSchema = apiResponseSchema(billingCardSchema.nullable());

export const billingInvoiceSchema = z.object({
  id: z.uuid(),
  number: z.string().nullable(),
  status: z.string(),
  currency: z.string().min(1),
  amountDue: z.number().int().nonnegative(),
  amountPaid: z.number().int().nonnegative(),
  hostedInvoiceUrl: z.string().nullable(),
  invoicePdf: z.string().nullable(),
  paidAt: z.coerce.date().nullable(),
  stripeCreatedAt: z.coerce.date(),
});

export const billingInvoicePageSchema = z.object({
  items: z.array(billingInvoiceSchema),
  nextCursor: z.string().nullable(),
});

export const billingInvoicesResponseSchema = apiResponseSchema(billingInvoicePageSchema);

export const paymentMethodUpdateStatusSchema = z.enum(['PENDING', 'APPLIED', 'CANCELED']);

export const paymentMethodUpdateSchema = z.object({
  updateId: z.uuid(),
  status: paymentMethodUpdateStatusSchema,
  clientSecret: z.string().nullable(),
});

export const paymentMethodUpdateResponseSchema = apiResponseSchema(paymentMethodUpdateSchema);

export const planChangeModeSchema = z.enum(['IMMEDIATE', 'PERIOD_END']);

export const planChangeStatusSchema = z.enum([
  'QUOTED',
  'PROCESSING',
  'PENDING_PAYMENT',
  'SCHEDULED',
  'APPLIED',
  'CANCELED',
  'EXPIRED',
]);

export const planChangeSchema = z.object({
  id: z.uuid(),
  sourcePlanPriceId: z.uuid(),
  targetPlanPriceId: z.uuid(),
  mode: planChangeModeSchema,
  status: planChangeStatusSchema,
  currency: z.string().min(1),
  amountDueNow: z.number().int().nonnegative(),
  targetAmountInCents: z.number().int().nonnegative(),
  targetInterval: z.enum(['MONTH', 'YEAR']),
  targetIntervalCount: z.number().int().positive(),
  effectiveAt: z.coerce.date().nullable(),
  quoteExpiresAt: z.coerce.date(),
  clientSecret: z.string().nullable(),
});

export const planChangeResponseSchema = apiResponseSchema(planChangeSchema);

export const billingPortalResponseSchema = apiResponseSchema(
  z.object({
    url: z.string().url(),
  }),
);

export const billingApiErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export const billingReturnParamsSchema = z.object({
  organizationId: z.uuid(),
  operationId: z.uuid(),
  kind: z.enum(['payment-method', 'plan-change']),
});
