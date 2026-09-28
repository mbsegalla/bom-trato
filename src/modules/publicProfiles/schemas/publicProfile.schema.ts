import { z } from 'zod';

import { isValidBrazilianPhone } from '@/shared/formatters/phone.formatter';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() || null;
}

export const publicProfileSettingsSchema = z.object({
  id: z.uuid().nullable(),
  slug: z.string(),
  headline: z.string().nullable(),
  description: z.string().nullable(),
  whatsappPhone: z.string().nullable(),
  whatsappEnabled: z.boolean(),
  published: z.boolean(),
  publishedAt: z.coerce.date().nullable(),
  selectedServiceIds: z.array(z.uuid()),
  city: z.string().nullable(),
  state: z.string().nullable(),
});

export const publicProfileFormSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3, 'Informe uma URL com pelo menos 3 caracteres.')
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.'),
    headline: z.preprocess(nullableText, z.string().max(160).nullable()),
    description: z.preprocess(nullableText, z.string().max(3000).nullable()),
    whatsappPhone: z.preprocess(nullableText, z.string().nullable()),
    whatsappEnabled: z.boolean(),
    published: z.boolean(),
    serviceIds: z.array(z.uuid()).max(20),
  })
  .superRefine((data, context) => {
    if (data.whatsappEnabled && (!data.whatsappPhone || !isValidBrazilianPhone(data.whatsappPhone))) {
      context.addIssue({
        code: 'custom',
        path: ['whatsappPhone'],
        message: 'Informe um WhatsApp válido.',
      });
    }

    if (data.published && !data.whatsappEnabled) {
      context.addIssue({
        code: 'custom',
        path: ['published'],
        message: 'Ative o contato pelo WhatsApp antes de publicar.',
      });
    }
  });

const publicProfessionalServiceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const publicProfessionalDetailedServiceSchema = publicProfessionalServiceSchema.extend({
  description: z.string().nullable(),
});

export const publicProfessionalCardSchema = z.object({
  slug: z.string(),
  name: z.string(),
  logoUrl: z.url().nullable(),
  headline: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  whatsappAvailable: z.boolean(),
  ratingAverage: z.number().min(1).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  services: z.array(publicProfessionalServiceSchema),
});

export const publicProfessionalReviewSchema = z.object({
  id: z.uuid(),
  reviewerDisplayName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
  verified: z.literal(true),
});

export const publicProfessionalSchema = publicProfessionalCardSchema.extend({
  description: z.string().nullable(),
  services: z.array(publicProfessionalDetailedServiceSchema),
  reviews: z.array(publicProfessionalReviewSchema),
});

export const publicProfileSettingsResponseSchema = apiResponseSchema(publicProfileSettingsSchema);

export const publicProfessionalResponseSchema = apiResponseSchema(publicProfessionalSchema);

export const publicProfessionalsResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(publicProfessionalCardSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);
