import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const workOrderRecurrenceUnitSchema = z.enum(['DAY', 'WEEK', 'MONTH']);

export const workOrderRecurrenceLimits = { DAY: 365, WEEK: 52, MONTH: 12 } as const;

const visitDateSchema = z.iso
  .date('Informe uma data válida.')
  .refine((value) => value >= '2000-01-01', 'Informe uma data válida.');

const recurrenceFieldsSchema = z.object({
  intervalUnit: workOrderRecurrenceUnitSchema,
  intervalCount: z.number().int('Informe um número inteiro.').min(1, 'Informe uma frequência maior que zero.').max(365),
  nextVisitOn: visitDateSchema,
  enabled: z.boolean(),
});

export const workOrderRecurrenceFormSchema = recurrenceFieldsSchema
  .extend({ autoGenerateEnabled: z.boolean().optional() })
  .refine(({ intervalUnit, intervalCount }) => intervalCount <= workOrderRecurrenceLimits[intervalUnit], {
    path: ['intervalCount'],
    message: 'A frequência ultrapassa o limite da unidade escolhida.',
  });

export const workOrderRecurrenceSchema = recurrenceFieldsSchema
  .extend({
    version: z.number().int().min(1).max(2147483647),
    autoGenerateEnabled: z.boolean(),
    lastGeneratedQuoteId: z.uuid().nullable(),
    lastGeneratedVisitOn: visitDateSchema.nullable(),
  })
  .refine(({ intervalUnit, intervalCount }) => intervalCount <= workOrderRecurrenceLimits[intervalUnit]);

export const workOrderRecurrenceViewSchema = z.object({
  recurrence: workOrderRecurrenceSchema.nullable(),
  canConfigure: z.boolean(),
  customerArchived: z.boolean(),
  today: visitDateSchema,
  completedOn: visitDateSchema.nullable(),
});

export const workOrderRecurrenceResponseSchema = apiResponseSchema(workOrderRecurrenceViewSchema);

export const workOrderRecurrenceListStatusSchema = z.enum(['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED']);
export const workOrderRecurrenceVisitPeriodSchema = z.enum(['ALL', 'OVERDUE', 'TODAY', 'NEXT_SEVEN_DAYS']);

const workOrderRecurrenceListItemSchema = z.object({
  workOrderId: z.uuid(),
  title: z.string(),
  customerId: z.uuid(),
  customerName: z.string(),
  customerArchived: z.boolean(),
  recurrence: workOrderRecurrenceSchema,
});

const workOrderRecurrenceListSchema = z.object({
  items: z.array(workOrderRecurrenceListItemSchema),
  page: z.number().int().positive(),
  hasMore: z.boolean(),
  today: visitDateSchema,
  canConfigure: z.boolean(),
});

export const workOrderRecurrencesResponseSchema = apiResponseSchema(workOrderRecurrenceListSchema);
export { workOrderRecurrenceListItemSchema, workOrderRecurrenceListSchema };
