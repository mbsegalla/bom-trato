import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const receivableLivePixSchema = z.object({
  organizationId: z.uuid(),
  receivableId: z.uuid(),
  receivableVersion: z.number().int().positive(),
  available: z.boolean(),
  canIssue: z.boolean(),
  canRecover: z.boolean(),
  status: z.enum(['NOT_ISSUED', 'PROCESSING', 'PENDING', 'REVIEW_REQUIRED', 'EXPIRED', 'STALE', 'SETTLED', 'CLOSED']),
  issuanceId: z.uuid().nullable(),
  amountInCents: z.number().int().positive().max(2147483647).nullable(),
  paymentId: z.string().regex(/^[1-9]\d{0,29}$/).nullable(),
  expiresAt: z.iso.datetime().transform((value) => new Date(value)).nullable(),
  copyAndPaste: z.string().max(1024).regex(/^000201[\x20-\x7E]+6304[0-9A-Fa-f]{4}$/).nullable(),
  reviewCode: z.string().max(50).nullable(),
  lastRecoveryCode: z.string().max(50).nullable(),
  nextRecoveryAt: z.iso.datetime().transform((value) => new Date(value)).nullable(),
  lastWebhookCode: z.string().max(50).nullable(),
  liveMode: z.literal(true),
}).refine((view) =>
  view.status === 'PENDING'
    ? view.available && view.issuanceId !== null && view.paymentId !== null && view.amountInCents !== null &&
      view.expiresAt !== null && view.copyAndPaste !== null && !view.canIssue
    : view.copyAndPaste === null && (!view.canIssue || (view.available && view.status === 'NOT_ISSUED' && view.issuanceId === null)),
);

export const receivableLivePixResponseSchema = apiResponseSchema(receivableLivePixSchema);

export const createReceivableLivePixSchema = z.object({
  version: z.number().int().positive(),
  buyerEmail: z.email().max(254),
  buyerDocumentType: z.enum(['CPF', 'CNPJ']),
  buyerDocumentNumber: z.string(),
  confirmed: z.literal(true),
}).refine((input) =>
  (input.buyerDocumentType === 'CPF' ? /^\d{11}$/ : /^\d{14}$/).test(input.buyerDocumentNumber),
);
