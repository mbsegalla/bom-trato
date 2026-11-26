import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const receivablePixChargeSchema = z.object({
  organizationId: z.uuid(),
  receivableId: z.uuid(),
  receivableVersion: z.number().int().positive(),
  receivingSettingsVersion: z.number().int().positive(),
  amountInCents: z.number().int().positive().max(2147483647),
  currency: z.literal('brl'),
  merchantName: z.string().min(1).max(25),
  txid: z.string().regex(/^[A-Z0-9]{25}$/),
  copyAndPaste: z
    .string()
    .max(300)
    .regex(/^000201[\x20-\x7E]+6304[0-9A-F]{4}$/),
});

export const receivablePixChargeResponseSchema = apiResponseSchema(receivablePixChargeSchema);
