import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const planPriceSchema = z.object({
  id: z.uuid(),
  amountInCents: z.number().int().nonnegative(),
  currency: z.literal('brl'),
  interval: z.enum(['MONTH', 'YEAR']),
  intervalCount: z.number().int().positive(),
});

export const planSchema = z.object({
  id: z.uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  maxUsers: z.number().int().positive(),
  teamManagementEnabled: z.boolean(),
  prices: z.array(planPriceSchema),
});

export const planListResponseSchema = apiResponseSchema(z.array(planSchema));
