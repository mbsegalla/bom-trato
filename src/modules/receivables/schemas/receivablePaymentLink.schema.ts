import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const expirySchema = z.iso.datetime().transform((value) => new Date(value));

export const receivablePaymentLinkStatusSchema = z.object({
  active: z.boolean(),
  expiresAt: expirySchema,
});

export const createdReceivablePaymentLinkSchema = z.object({
  url: z.url(),
  expiresAt: expirySchema,
});

export const publicReceivablePaymentLinkSchema = z.object({
  organizationName: z.string().min(1).max(100),
  merchantName: z.string().min(1).max(25),
  amountInCents: z.number().int().positive().max(2147483647),
  currency: z.literal('brl'),
  copyAndPaste: z
    .string()
    .max(300)
    .regex(/^000201[\x20-\x7E]+6304[0-9A-F]{4}$/),
  expiresAt: expirySchema,
});

export const receivablePaymentLinkStatusResponseSchema = apiResponseSchema(
  receivablePaymentLinkStatusSchema.nullable(),
);
export const createdReceivablePaymentLinkResponseSchema = apiResponseSchema(createdReceivablePaymentLinkSchema);
export const publicReceivablePaymentLinkResponseSchema = apiResponseSchema(publicReceivablePaymentLinkSchema);
