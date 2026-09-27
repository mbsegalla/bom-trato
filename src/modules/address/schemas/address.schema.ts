import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const addressLookupSchema = z.object({
  postalCode: z.string().regex(/^\d{8}$/),
  street: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().regex(/^[A-Z]{2}$/),
  cityIbgeCode: z.string().nullable(),
  stateIbgeCode: z.string().nullable(),
});

export const brazilianStateSchema = z.object({
  code: z.string().regex(/^[A-Z]{2}$/),
  name: z.string().min(1),
});

export const brazilianCitySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

export const addressLookupResponseSchema = apiResponseSchema(addressLookupSchema);

export const brazilianStatesResponseSchema = apiResponseSchema(z.array(brazilianStateSchema));

export const brazilianCitiesResponseSchema = apiResponseSchema(z.array(brazilianCitySchema));
