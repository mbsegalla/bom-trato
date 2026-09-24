import { z } from 'zod';

import { serviceUnitSchema } from '@/modules/serviceCatalog/schemas/catalogService.schema';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

const nullableInstructionsSchema = z.preprocess(
  nullableText,
  z.string().max(5000, 'As instruções devem ter no máximo 5000 caracteres.').nullable(),
);

const nullableAddressSchema = z.preprocess(
  nullableText,
  z.string().max(500, 'O endereço deve ter no máximo 500 caracteres.').nullable(),
);

const nullableExecutionNotesSchema = z.preprocess(
  nullableText,
  z.string().max(10000, 'As observações devem ter no máximo 10000 caracteres.').nullable(),
);

const scheduleDateSchema = z
  .string()
  .trim()
  .min(1, 'Informe a data e o horário.')
  .transform((value, context) => {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma data e horário válidos.',
      });

      return z.NEVER;
    }

    return date.toISOString();
  });

export const workOrderStatusSchema = z.enum(['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);

export const workOrderListStatusSchema = z.enum(['ALL', 'OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);

export const workOrderItemSchema = z.object({
  id: z.uuid(),
  sourceQuoteItemId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  unit: serviceUnitSchema,
  quantityInThousandths: z.number().int().positive(),
  unitAmountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  position: z.number().int().nonnegative(),
});

export const workOrderSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  quoteId: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  customerEmail: z.string().email().nullable(),
  customerPhone: z.string().nullable(),
  title: z.string(),
  instructions: z.string().nullable(),
  serviceAddress: z.string().nullable(),
  executionNotes: z.string().nullable(),
  assignedToId: z.uuid().nullable(),
  status: workOrderStatusSchema,
  currency: z.literal('brl'),
  subtotalInCents: z.number().int().nonnegative(),
  discountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  scheduledStartAt: z.coerce.date().nullable(),
  scheduledEndAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  cancellationReason: z.string().nullable(),
  version: z.number().int().positive(),
  createdById: z.uuid(),
  updatedById: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  items: z.array(workOrderItemSchema),
});

export const workOrderSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  quoteId: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  title: z.string(),
  assignedToId: z.uuid().nullable(),
  status: workOrderStatusSchema,
  currency: z.literal('brl'),
  totalInCents: z.number().int().nonnegative(),
  scheduledStartAt: z.coerce.date().nullable(),
  scheduledEndAt: z.coerce.date().nullable(),
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const workOrdersResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(workOrderSummarySchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const workOrderResponseSchema = apiResponseSchema(workOrderSchema);

export const workOrderStatusHistorySchema = z.object({
  id: z.uuid(),
  workOrderId: z.uuid(),
  fromStatus: workOrderStatusSchema.nullable(),
  toStatus: workOrderStatusSchema,
  actorId: z.uuid(),
  version: z.number().int().positive(),
  reason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const workOrderStatusHistoryResponseSchema = apiResponseSchema(z.array(workOrderStatusHistorySchema));

export const workOrderScheduleHistoryItemSchema = z.object({
  id: z.uuid(),
  workOrderId: z.uuid(),
  fromAssignedToId: z.uuid().nullable(),
  toAssignedToId: z.uuid().nullable(),
  fromStartAt: z.coerce.date().nullable(),
  fromEndAt: z.coerce.date().nullable(),
  toStartAt: z.coerce.date().nullable(),
  toEndAt: z.coerce.date().nullable(),
  fromStatus: workOrderStatusSchema,
  toStatus: workOrderStatusSchema,
  actorId: z.uuid(),
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
});

export const workOrderScheduleHistoryResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(workOrderScheduleHistoryItemSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const workOrderPlanningFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Informe um título com pelo menos 2 caracteres.')
    .max(150, 'O título deve ter no máximo 150 caracteres.'),
  instructions: nullableInstructionsSchema,
  serviceAddress: nullableAddressSchema,
});

export const workOrderScheduleFormSchema = z
  .object({
    scheduledStartAt: scheduleDateSchema,
    scheduledEndAt: scheduleDateSchema,
  })
  .superRefine((value, context) => {
    const start = new Date(value.scheduledStartAt);
    const end = new Date(value.scheduledEndAt);

    if (start.getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledStartAt'],
        message: 'O início precisa estar no futuro.',
      });
    }

    if (end.getTime() <= start.getTime()) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledEndAt'],
        message: 'O término precisa acontecer depois do início.',
      });
    }
  });

export const workOrderExecutionNotesFormSchema = z.object({
  executionNotes: nullableExecutionNotesSchema,
});

export const workOrderCancelFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Informe um motivo com pelo menos 5 caracteres.')
    .max(1000, 'O motivo deve ter no máximo 1000 caracteres.'),
});
