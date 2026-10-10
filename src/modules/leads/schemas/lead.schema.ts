import { z } from 'zod';

import { isValidBrazilianPhone } from '@/shared/formatters/phone.formatter';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const leadStatusSchema = z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED']);

export const leadSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  catalogServiceId: z.uuid().nullable(),
  requestedServiceName: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  message: z.string(),
  status: leadStatusSchema,
  convertedCustomerId: z.uuid().nullable(),
  convertedQuoteId: z.uuid().nullable(),
  contactedAt: z.coerce.date().nullable(),
  convertedAt: z.coerce.date().nullable(),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const publicLeadFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(100),
    email: z
      .string()
      .trim()
      .refine((value) => !value || z.email().safeParse(value).success, 'Informe um e-mail válido.'),
    phone: z
      .string()
      .trim()
      .min(1, 'Informe seu telefone.')
      .refine((value) => isValidBrazilianPhone(value), 'Informe um telefone válido.'),
    catalogServiceId: z.string().trim().nullable(),
    message: z.string().trim().min(10, 'Conte um pouco mais sobre o serviço.').max(2000),
  })
  .superRefine((data, context) => {
    if (!data.email && !data.phone) {
      context.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Informe um e-mail ou telefone para contato.',
      });

      return;
    }

    if (data.email && !z.email().safeParse(data.email).success) {
      context.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Informe um e-mail válido.',
      });
    }

    if (data.phone && !isValidBrazilianPhone(data.phone)) {
      context.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Informe um telefone válido.',
      });
    }
  });

export const leadsResponseSchema = apiResponseSchema(
  z.object({
    items: z.array(leadSchema),
    page: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
);

export const leadResponseSchema = apiResponseSchema(leadSchema);

export const publicLeadCreatedResponseSchema = apiResponseSchema(
  z.object({
    id: z.uuid(),
    createdAt: z.coerce.date(),
  }),
);

export const convertLeadResponseSchema = apiResponseSchema(
  z.object({
    lead: leadSchema,
    customerId: z.uuid(),
    quoteId: z.uuid(),
  }),
);
