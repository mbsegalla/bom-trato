import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const workOrderWarrantySchema = z.object({
  durationDays: z.number().int().min(1).max(3650),
  terms: z.string().min(1).max(2000),
  version: z.number().int().positive(),
  expiresAt: z.coerce.date().nullable(),
});

export const workOrderWarrantyResponseSchema = apiResponseSchema(
  z.object({ warranty: workOrderWarrantySchema.nullable(), locked: z.boolean() }),
);

export const workOrderWarrantyFormSchema = z.object({
  durationDays: z.number().int().min(1, 'Informe pelo menos 1 dia.').max(3650, 'O prazo máximo é de 3650 dias.'),
  terms: z
    .string()
    .trim()
    .min(1, 'Informe as condições da garantia.')
    .max(2000, 'As condições devem ter no máximo 2000 caracteres.'),
});
