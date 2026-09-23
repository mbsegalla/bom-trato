import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const checkoutResponseSchema = apiResponseSchema(
  z.object({
    attemptId: z.uuid(),
    clientSecret: z.string().min(1),
  }),
);

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
