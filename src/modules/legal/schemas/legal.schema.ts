import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const legalDocumentSchema = z.object({
  version: z.string().min(1),
  effectiveAt: z.coerce.date(),
  path: z.string().min(1),
});

export const currentLegalDocumentsResponseSchema = apiResponseSchema(
  z.object({
    terms: legalDocumentSchema,
    privacy: legalDocumentSchema,
  }),
);
