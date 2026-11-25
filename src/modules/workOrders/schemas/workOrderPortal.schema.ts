import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

import { workOrderItemSchema, workOrderStatusSchema } from './workOrder.schema';
import { publicWorkOrderAcceptanceSchema } from './workOrderAcceptance.schema';
import { publicWorkOrderChecklistSchema } from './workOrderChecklist.schema';
import { publicWorkOrderPhotoSchema } from './workOrderPhoto.schema';

export const workOrderShareTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

const workOrderShareUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);

    const token = new URLSearchParams(url.hash.slice(1)).get('token');

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/acompanhar' &&
      url.search === '' &&
      workOrderShareTokenSchema.safeParse(token).success
    );
  } catch {
    return false;
  }
});

export const workOrderShareStatusSchema = z.object({
  id: z.uuid(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export const workOrderShareSchema = workOrderShareStatusSchema.extend({
  url: workOrderShareUrlSchema,
});

export const workOrderShareStatusResponseSchema = apiResponseSchema(workOrderShareStatusSchema.nullable());

export const workOrderShareResponseSchema = apiResponseSchema(workOrderShareSchema);

export const publicWorkOrderTimelineEventTypeSchema = z.enum([
  'QUOTE_APPROVED',
  'WORK_ORDER_CREATED',
  'WORK_ORDER_SCHEDULED',
  'WORK_ORDER_RESCHEDULED',
  'WORK_ORDER_STARTED',
  'WORK_ORDER_COMPLETED',
  'WORK_ORDER_CANCELED',
]);

export const publicWorkOrderTimelineEventSchema = z.object({
  type: publicWorkOrderTimelineEventTypeSchema,
  occurredAt: z.coerce.date(),
  scheduledStartAt: z.coerce.date().nullable(),
  scheduledEndAt: z.coerce.date().nullable(),
});

export const publicWorkOrderItemSchema = workOrderItemSchema.omit({
  id: true,
  sourceQuoteItemId: true,
});

export const publicWorkOrderDetailsSchema = z.object({
  title: z.string(),
  status: workOrderStatusSchema,
  currency: z.literal('brl'),
  subtotalInCents: z.number().int().nonnegative(),
  discountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  responsibleName: z.string().nullable(),
  scheduledStartAt: z.coerce.date().nullable(),
  scheduledEndAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  items: z.array(publicWorkOrderItemSchema),
});

export const publicWorkOrderFinancialSchema = z.object({
  receivedInCents: z.number().int().nonnegative(),
  remainingContractInCents: z.number().int().nonnegative().nullable(),
  outstandingReceivablesInCents: z.number().int().nonnegative(),
});

export const publicWorkOrderOrganizationSchema = z.object({
  name: z.string(),
  logoUrl: z.url().nullable(),
});

export const publicWorkOrderSchema = z.object({
  organization: publicWorkOrderOrganizationSchema,
  workOrder: publicWorkOrderDetailsSchema,
  financial: publicWorkOrderFinancialSchema.nullable(),
  timeline: z.array(publicWorkOrderTimelineEventSchema),
  checklist: publicWorkOrderChecklistSchema.default({ items: [], progress: { total: 0, completed: 0 } }),
  photos: z.array(publicWorkOrderPhotoSchema).default([]),
  acceptance: publicWorkOrderAcceptanceSchema.nullable().default(null),
  warranty: z
    .object({
      durationDays: z.number().int().positive(),
      terms: z.string().min(1),
      expiresAt: z.coerce.date(),
    })
    .nullable()
    .default(null),
  generatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export const publicWorkOrderResponseSchema = apiResponseSchema(publicWorkOrderSchema);
