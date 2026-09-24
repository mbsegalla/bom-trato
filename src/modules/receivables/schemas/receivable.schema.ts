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

function dateInputToEndOfDayIso(value: string, context: z.RefinementCtx): string {
  const parts = value.split('-').map(Number);

  if (parts.length !== 3) {
    context.addIssue({
      code: 'custom',
      message: 'Informe uma data válida.',
    });

    return z.NEVER;
  }

  const [year, month, day] = parts;

  if (year === undefined || month === undefined || day === undefined) {
    context.addIssue({
      code: 'custom',
      message: 'Informe uma data válida.',
    });

    return z.NEVER;
  }

  const date = new Date(year, month - 1, day, 23, 59, 59, 999);

  if (
    !Number.isFinite(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Informe uma data válida.',
    });

    return z.NEVER;
  }

  return date.toISOString();
}

const notesSchema = z.preprocess(
  nullableText,
  z.string().max(2000, 'As observações devem ter no máximo 2000 caracteres.').nullable(),
);

const dueAtSchema = z.string().trim().min(1, 'Informe o vencimento.').transform(dateInputToEndOfDayIso);

const paymentAmountSchema = z
  .string()
  .trim()
  .min(1, 'Informe o valor recebido.')
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
  .pipe(
    z.number().int().min(1, 'O valor precisa ser maior que zero.').max(2147483647, 'O valor informado é muito alto.'),
  );

const receivedAtSchema = z
  .string()
  .trim()
  .min(1, 'Informe quando o pagamento foi recebido.')
  .transform((value, context) => {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) {
      context.addIssue({
        code: 'custom',
        message: 'Informe uma data válida.',
      });

      return z.NEVER;
    }

    if (date.getTime() > Date.now()) {
      context.addIssue({
        code: 'custom',
        message: 'O pagamento não pode estar no futuro.',
      });

      return z.NEVER;
    }

    return date.toISOString();
  });

export const receivableStatusSchema = z.enum(['OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELED']);

export const receivableListStatusSchema = z.enum(['ALL', 'OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELED']);

export const receivablePaymentMethodSchema = z.enum([
  'CASH',
  'PIX',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'OTHER',
]);

export const receivableSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  workOrderId: z.uuid(),
  customerId: z.uuid(),
  customerName: z.string(),
  title: z.string(),
  currency: z.literal('brl'),
  amountInCents: z.number().int().nonnegative(),
  receivedInCents: z.number().int().nonnegative(),
  balanceInCents: z.number().int().nonnegative(),
  status: receivableStatusSchema,
  overdue: z.boolean(),
  dueAt: z.coerce.date(),
  notes: z.string().nullable(),
  canceledAt: z.coerce.date().nullable(),
  canceledById: z.uuid().nullable(),
  cancellationReason: z.string().nullable(),
  version: z.number().int().positive(),
  createdById: z.uuid(),
  updatedById: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const receivablesResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(receivableSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const receivableResponseSchema = apiResponseSchema(receivableSchema);

export const receivablePaymentSchema = z.object({
  id: z.uuid(),
  receivableId: z.uuid(),
  requestId: z.uuid(),
  amountInCents: z.number().int().positive(),
  method: receivablePaymentMethodSchema,
  receivedAt: z.coerce.date(),
  notes: z.string().nullable(),
  recordedById: z.uuid(),
  createdAt: z.coerce.date(),
  reversedAt: z.coerce.date().nullable(),
  reversedById: z.uuid().nullable(),
  reversalReason: z.string().nullable(),
});

export const receivablePaymentsResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(receivablePaymentSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const receivablePaymentResultResponseSchema = apiResponseSchema(
  z.object({
    receivable: receivableSchema,
    payment: receivablePaymentSchema,
  }),
);

export const receivableFinancialSchema = apiResponseSchema(
  z.object({
    generatedAt: z.coerce.date(),
    currency: z.literal('brl'),
    period: z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    }),
    currentReceivables: z.object({
      pendingCount: z.number().int().nonnegative(),
      pendingAmountInCents: z.number().int().nonnegative(),
      overdueCount: z.number().int().nonnegative(),
      overdueAmountInCents: z.number().int().nonnegative(),
    }),
    periodReceipts: z.object({
      count: z.number().int().nonnegative(),
      amountInCents: z.number().int().nonnegative(),
    }),
  }),
);

export const createReceivableFormSchema = z.object({
  dueAt: dueAtSchema,
  notes: notesSchema,
});

export const updateReceivableFormSchema = z.object({
  dueAt: dueAtSchema,
  notes: notesSchema,
});

export const receivablePaymentFormSchema = z.object({
  amountInCents: paymentAmountSchema,
  method: receivablePaymentMethodSchema,
  receivedAt: receivedAtSchema,
  notes: notesSchema,
});

export const receivableCancelFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Informe um motivo com pelo menos 3 caracteres.')
    .max(1000, 'O motivo deve ter no máximo 1000 caracteres.'),
});

export const receivableReversePaymentFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Informe um motivo com pelo menos 3 caracteres.')
    .max(1000, 'O motivo deve ter no máximo 1000 caracteres.'),
});
