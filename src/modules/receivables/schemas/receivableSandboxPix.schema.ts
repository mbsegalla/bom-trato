import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const receivableSandboxPixSchema = z
  .object({
    organizationId: z.uuid(),
    receivableId: z.uuid(),
    receivableVersion: z.number().int().positive(),
    available: z.boolean(),
    canIssue: z.boolean(),
    status: z.enum(['NOT_ISSUED', 'PROCESSING', 'PENDING', 'REVIEW_REQUIRED', 'EXPIRED', 'STALE']),
    issuanceId: z.uuid().nullable(),
    amountInCents: z.number().int().positive().max(2147483647).nullable(),
    paymentId: z
      .string()
      .regex(/^[1-9]\d{0,29}$/)
      .nullable(),
    expiresAt: z.iso
      .datetime()
      .transform((value) => new Date(value))
      .nullable(),
    copyAndPaste: z
      .string()
      .max(1024)
      .regex(/^000201[\x20-\x7E]+6304[0-9A-Fa-f]{4}$/)
      .nullable(),
    liveMode: z.literal(false),
  })
  .refine((view) =>
    view.status === 'PENDING'
      ? view.available &&
        view.issuanceId !== null &&
        view.paymentId !== null &&
        view.amountInCents !== null &&
        view.expiresAt !== null &&
        view.copyAndPaste !== null &&
        !view.canIssue
      : view.copyAndPaste === null &&
        (!view.canIssue || (view.available && view.status === 'NOT_ISSUED' && view.issuanceId === null)),
  );

export const receivableSandboxPixResponseSchema = apiResponseSchema(receivableSandboxPixSchema);

export const createReceivableSandboxPixSchema = z
  .object({
    version: z.number().int().positive(),
    testBuyerEmail: z.email().max(254),
    testDocumentType: z.enum(['CPF', 'CNPJ']),
    testDocumentNumber: z.string(),
    confirmed: z.literal(true),
  })
  .refine((input) => (input.testDocumentType === 'CPF' ? /^\d{11}$/ : /^\d{14}$/).test(input.testDocumentNumber));
