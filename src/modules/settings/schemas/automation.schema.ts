import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const automationTypeSchema = z.enum([
  'QUOTE_FOLLOW_UP',
  'WORK_ORDER_REMINDER',
  'REVIEW_REQUEST',
  'RECEIVABLE_DUE_SOON',
  'RECEIVABLE_OVERDUE',
]);

export const automationEntityTypeSchema = z.enum(['QUOTE', 'WORK_ORDER', 'RECEIVABLE']);

export const automationStatusSchema = z.enum(['PENDING', 'PROCESSING', 'ACCEPTED', 'FAILED', 'SKIPPED']);

export const automationEventSchema = z.object({
  id: z.uuid(),
  type: automationTypeSchema,
  entityType: automationEntityTypeSchema,
  entityId: z.uuid(),
  description: z.string(),
  href: z.string(),
  status: automationStatusSchema,
  availableAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  finishedAt: z.coerce.date().nullable(),
  lastErrorCode: z.string().nullable(),
});

export const automationEventsResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(automationEventSchema),
  }),
);
