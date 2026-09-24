import { z } from 'zod';

import { workOrderStatusSchema } from '@/modules/workOrders/schemas/workOrder.schema';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const scheduleItemSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  title: z.string(),
  serviceAddress: z.string().nullable(),
  assignedToId: z.uuid().nullable(),
  assignedToName: z.string().nullable(),
  status: workOrderStatusSchema,
  scheduledStartAt: z.coerce.date(),
  scheduledEndAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable(),
  version: z.number().int().positive(),
  late: z.boolean(),
});

export const scheduleResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(scheduleItemSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
    generatedAt: z.coerce.date(),
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
);
