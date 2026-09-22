import { z } from 'zod';

export function apiResponseSchema<T>(dataSchema: z.ZodType<T>) {
  return z
    .object({
      statusCode: z.number().int(),
      success: z.literal(true),
      data: dataSchema,
    })
    .transform((response) => response.data);
}
