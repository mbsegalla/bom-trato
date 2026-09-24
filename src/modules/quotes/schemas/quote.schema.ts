import { z } from 'zod';

import { serviceUnitSchema } from '@/modules/serviceCatalog/schemas/catalogService.schema';
import { parseBrlCurrencyToCents } from '@/shared/parses/currency.parser';
import { parseQuantity } from '@/shared/parses/quantity.parser';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

const nullableNotesSchema = z.preprocess(
  nullableText,
  z.string().max(5000, 'As observações devem ter no máximo 5000 caracteres.').nullable(),
);

const nullableDescriptionSchema = z.preprocess(
  nullableText,
  z.string().max(2000, 'A descrição deve ter no máximo 2000 caracteres.').nullable(),
);

const validUntilSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    if (value.length === 0) {
      return null;
    }

    const date = new Date(value);

    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma validade futura.',
      });

      return z.NEVER;
    }

    return date.toISOString();
  });

const discountSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    if (value.length === 0) {
      return 0;
    }

    const amountInCents = parseBrlCurrencyToCents(value);

    if (amountInCents === null) {
      context.addIssue({
        code: 'custom',
        message: 'Informe um desconto válido.',
      });

      return z.NEVER;
    }

    return amountInCents;
  });

const unitAmountSchema = z
  .string()
  .trim()
  .min(1, 'Informe o valor unitário.')
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
  });

const quantitySchema = z
  .string()
  .trim()
  .transform((value, context) => {
    const quantity = parseQuantity(value);

    if (quantity === null) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma quantidade válida com até 3 casas decimais.',
      });

      return z.NEVER;
    }

    return quantity;
  });

export const quoteStatusSchema = z.enum(['DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'CANCELED']);

export const quoteListStatusSchema = z.enum(['ALL', 'DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'CANCELED']);

export const quoteItemSchema = z.object({
  id: z.uuid(),
  catalogServiceId: z.uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  unit: serviceUnitSchema,
  quantityInThousandths: z.number().int().positive(),
  unitAmountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  position: z.number().int().nonnegative(),
});

export const quoteSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  customerEmail: z.string().email().nullable(),
  customerPhone: z.string().nullable(),
  title: z.string(),
  notes: z.string().nullable(),
  status: quoteStatusSchema,
  currency: z.literal('brl'),
  discountInCents: z.number().int().nonnegative(),
  subtotalInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  validUntil: z.coerce.date().nullable(),
  sentAt: z.coerce.date().nullable(),
  decidedAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  createdById: z.uuid(),
  updatedById: z.uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  items: z.array(quoteItemSchema),
});

export const quoteSummarySchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  title: z.string(),
  status: quoteStatusSchema,
  currency: z.literal('brl'),
  totalInCents: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  validUntil: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const quotesResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(quoteSummarySchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const quoteResponseSchema = apiResponseSchema(quoteSchema);

export const quoteStatusHistorySchema = z.object({
  id: z.uuid(),
  quoteId: z.uuid(),
  fromStatus: quoteStatusSchema.nullable(),
  toStatus: quoteStatusSchema,
  actorId: z.uuid().nullable(),
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
});

export const quoteStatusHistoryResponseSchema = apiResponseSchema(z.array(quoteStatusHistorySchema));

export const quoteShareSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  quoteVersion: z.number().int().positive(),
  expiresAt: z.coerce.date(),
});

export const quoteShareResponseSchema = apiResponseSchema(quoteShareSchema);

export const publicQuoteItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  unit: serviceUnitSchema,
  quantityInThousandths: z.number().int().positive(),
  unitAmountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  position: z.number().int().nonnegative(),
});

export const publicQuoteSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  customerName: z.string(),
  status: quoteStatusSchema,
  version: z.number().int().positive(),
  currency: z.literal('brl'),
  subtotalInCents: z.number().int().nonnegative(),
  discountInCents: z.number().int().nonnegative(),
  totalInCents: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  validUntil: z.coerce.date().nullable(),
  organizationName: z.string(),
  sharedVersion: z.number().int().positive(),
  canDecide: z.boolean(),
  items: z.array(publicQuoteItemSchema),
  expiresAt: z.coerce.date(),
});

export const publicQuoteResponseSchema = apiResponseSchema(publicQuoteSchema);

export const publicQuoteDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'DECLINED']),
  decidedAt: z.coerce.date(),
  version: z.number().int().positive(),
});

export const publicQuoteDecisionResponseSchema = apiResponseSchema(publicQuoteDecisionSchema);

export const quoteShareTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const createQuoteFormSchema = z.object({
  customerId: z.uuid('Selecione um cliente.'),
  title: z
    .string()
    .trim()
    .min(2, 'Informe um título com pelo menos 2 caracteres.')
    .max(150, 'O título deve ter no máximo 150 caracteres.'),
  notes: nullableNotesSchema,
  validUntil: validUntilSchema,
});

export const updateQuoteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Informe um título com pelo menos 2 caracteres.')
    .max(150, 'O título deve ter no máximo 150 caracteres.'),
  notes: nullableNotesSchema,
  validUntil: validUntilSchema,
  discountInCents: discountSchema,
});

export const catalogQuoteItemFormSchema = z.object({
  catalogServiceId: z.uuid('Selecione um serviço.'),
  quantity: quantitySchema,
});

export const customQuoteItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  description: nullableDescriptionSchema,
  unit: serviceUnitSchema,
  quantity: quantitySchema,
  unitAmountInCents: unitAmountSchema,
});
