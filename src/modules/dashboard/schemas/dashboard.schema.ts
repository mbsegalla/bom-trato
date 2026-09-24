import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const dashboardPeriodSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const dashboardSummarySchema = apiResponseSchema(
  z.object({
    generatedAt: z.coerce.date(),
    period: dashboardPeriodSchema,
    quotes: z.object({
      draft: z.number().int().nonnegative(),
      awaitingApproval: z.number().int().nonnegative(),
      expiredSent: z.number().int().nonnegative(),
    }),
    workOrders: z.object({
      open: z.number().int().nonnegative(),
      scheduled: z.number().int().nonnegative(),
      inProgress: z.number().int().nonnegative(),
      completedInPeriod: z.number().int().nonnegative(),
    }),
  }),
);

export const dashboardFinancialSchema = apiResponseSchema(
  z.object({
    generatedAt: z.coerce.date(),
    currency: z.literal('brl'),
    period: dashboardPeriodSchema,
    currentReceivables: z.object({
      pendingCount: z.number().int().nonnegative(),
      pendingAmountInCents: z.number().int().nonnegative(),
      overdueCount: z.number().int().nonnegative(),
      overdueAmountInCents: z.number().int().nonnegative(),
    }),
    periodReceipts: z.object({
      count: z.number().int().nonnegative(),
      amountInCents: z.number().int().nonnegative(),
    }),
  }),
);

export const dashboardUpcomingSchema = apiResponseSchema(
  z.object({
    generatedAt: z.coerce.date(),
    items: z.array(
      z.object({
        id: z.uuid(),
        customerId: z.uuid(),
        customerName: z.string().min(1),
        title: z.string().min(1),
        serviceAddress: z.string().nullable(),
        scheduledStartAt: z.coerce.date().nullable(),
        scheduledEndAt: z.coerce.date().nullable(),
        assignedTo: z
          .object({
            id: z.uuid(),
            name: z.string().min(1),
          })
          .nullable(),
      }),
    ),
    hasMore: z.boolean(),
  }),
);
