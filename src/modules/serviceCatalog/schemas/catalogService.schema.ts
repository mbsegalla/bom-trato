import { z } from 'zod';

import { parseBrlCurrencyToCents } from '@/shared/parses/currency.parser';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

const nullableDescriptionSchema = z.preprocess(
  nullableText,
  z.string().max(2000, 'A descrição deve ter no máximo 2000 caracteres.').nullable(),
);

const amountInCentsSchema = z
  .string()
  .trim()
  .min(1, 'Informe o valor do serviço.')
  .transform((value, context) => {
    const amountInCents = parseBrlCurrencyToCents(value);

    if (amountInCents === null) {
      context.addIssue({
        code: 'custom',
        message: 'Informe um valor válido.',
      });

      return z.NEVER;
    }

    return amountInCents;
  })
  .pipe(z.number().int().min(0, 'O valor não pode ser negativo.').max(2147483647, 'O valor informado é muito alto.'));

export const serviceUnitSchema = z.enum(['SERVICE', 'HOUR', 'DAY', 'UNIT', 'SQUARE_METER']);

export const catalogServiceStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'ALL']);

export const catalogServiceSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  unit: serviceUnitSchema,
  amountInCents: z.number().int().nonnegative(),
  currency: z.literal('brl'),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const catalogServiceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  description: nullableDescriptionSchema,
  unit: serviceUnitSchema,
  amountInCents: amountInCentsSchema,
});

export const catalogServicesResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(catalogServiceSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const catalogServiceResponseSchema = apiResponseSchema(catalogServiceSchema);
