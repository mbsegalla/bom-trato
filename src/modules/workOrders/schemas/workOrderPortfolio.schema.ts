import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const portalPortfolioPhotoSchema = z.object({
  id: z.uuid(),
  consented: z.boolean(),
  published: z.boolean(),
});

export const portalPortfolioStatusSchema = z.object({
  canAuthorize: z.boolean(),
  photos: z.array(portalPortfolioPhotoSchema),
});

export const managementPortfolioPhotoSchema = portalPortfolioPhotoSchema.extend({
  stage: z.enum(['BEFORE', 'AFTER']),
  visibleInPortal: z.boolean(),
});

export const managementPortfolioStatusSchema = z.object({
  photos: z.array(managementPortfolioPhotoSchema),
});

export const portalPortfolioStatusResponseSchema = apiResponseSchema(portalPortfolioStatusSchema);
export const managementPortfolioStatusResponseSchema = apiResponseSchema(managementPortfolioStatusSchema);

export const portfolioConsentFormSchema = z.object({
  photoIds: z.array(z.uuid()).min(1, 'Escolha uma fotografia.').max(20),
  signerName: z.string().trim().min(2, 'Informe seu nome.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
  consent: z.literal(true, { error: 'Confirme a autorização de uso público das fotos.' }),
});
