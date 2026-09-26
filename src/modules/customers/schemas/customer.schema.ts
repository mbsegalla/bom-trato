import { z } from 'zod';

import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

const nullableEmailSchema = z.preprocess(
  nullableText,
  z.string().email('Informe um e-mail válido.').max(254, 'O e-mail deve ter no máximo 254 caracteres.').nullable(),
);

function nullablePhone(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalizeBrazilianPhone(normalized);
}

const nullablePhoneSchema = z.preprocess(
  nullablePhone,
  z.string().refine(isValidBrazilianPhone, 'Informe um telefone válido com DDD.').nullable(),
);

const nullableNotesSchema = z.preprocess(
  nullableText,
  z.string().max(5000, 'As observações devem ter no máximo 5000 caracteres.').nullable(),
);

export const customerStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'ALL']);

export const customerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: nullableEmailSchema,
  phone: nullablePhoneSchema,
  notes: nullableNotesSchema,
});

export const customersResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(customerSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const customerResponseSchema = apiResponseSchema(customerSchema);

export const customerOverviewSchema = apiResponseSchema(
  z.object({
    customer: customerSchema,
    summary: z.object({
      quoteCount: z.number().int().nonnegative(),
      workOrderCount: z.number().int().nonnegative(),
      completedWorkOrderCount: z.number().int().nonnegative(),
      pendingAmountInCents: z.number().int().nonnegative(),
      overdueAmountInCents: z.number().int().nonnegative(),
      receivedAmountInCents: z.number().int().nonnegative(),
      currency: z.literal('brl'),
    }),
    generatedAt: z.coerce.date(),
  }),
);
