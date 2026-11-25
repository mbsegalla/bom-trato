import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

import { workOrderItemSchema } from './workOrder.schema';

export const workOrderAcceptanceSnapshotHashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const publicWorkOrderAcceptanceReceiptSchema = z.object({
  acceptedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
});

export const publicWorkOrderAcceptanceSchema = z.object({
  canAccept: z.boolean(),
  snapshotHash: workOrderAcceptanceSnapshotHashSchema.nullable(),
  consentVersion: z.string().min(1),
  consentText: z.string().min(1),
  receipt: publicWorkOrderAcceptanceReceiptSchema.nullable(),
});

export const workOrderAcceptanceSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  organizationName: z.string(),
  workOrder: z.object({
    title: z.string(),
    currency: z.literal('brl'),
    subtotalInCents: z.number().int().nonnegative(),
    discountInCents: z.number().int().nonnegative(),
    totalInCents: z.number().int().nonnegative(),
    completedAt: z.coerce.date(),
    version: z.number().int().positive(),
    items: z.array(workOrderItemSchema.omit({ id: true, sourceQuoteItemId: true })),
  }),
});

export const workOrderAcceptanceReceiptSchema = publicWorkOrderAcceptanceReceiptSchema.extend({
  id: z.uuid(),
  signerName: z.string(),
  workOrderVersion: z.number().int().positive(),
  consentVersion: z.string().min(1),
  consentText: z.string().min(1),
  snapshotHash: workOrderAcceptanceSnapshotHashSchema,
  snapshot: workOrderAcceptanceSnapshotSchema,
});

export const workOrderAcceptanceStatusSchema = z.object({
  receipt: workOrderAcceptanceReceiptSchema.nullable(),
});

export const workOrderAcceptanceFormSchema = z.object({
  signerName: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(2, 'Informe seu nome com pelo menos 2 caracteres.')
        .max(100, 'O nome deve ter no máximo 100 caracteres.'),
    ),
  consent: z.literal(true, { error: 'Marque a confirmação da conclusão para registrar seu aceite.' }),
});

export const publicWorkOrderAcceptanceReceiptResponseSchema = apiResponseSchema(publicWorkOrderAcceptanceReceiptSchema);

export const workOrderAcceptanceStatusResponseSchema = apiResponseSchema(workOrderAcceptanceStatusSchema);
