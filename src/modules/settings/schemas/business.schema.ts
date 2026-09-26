import { z } from 'zod';

import { isValidBrazilianPhone, normalizeBrazilianPhone } from '@/shared/formatters/phone.formatter';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const organizationDocumentTypeSchema = z.enum(['CPF', 'CNPJ']);

export const businessProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  documentType: organizationDocumentTypeSchema.nullable(),
  document: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const businessProfileResponseSchema = apiResponseSchema(businessProfileSchema);

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() || null;
}

function nullableDigits(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.replace(/\D/g, '');

  return normalized || null;
}

function nullablePhone(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalizeBrazilianPhone(normalized);
}

export const businessProfileFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe um nome com pelo menos 2 caracteres.').max(100),
    email: z.preprocess(nullableText, z.string().email('Informe um e-mail válido.').max(254).nullable()),
    phone: z.preprocess(
      nullablePhone,
      z.string().refine(isValidBrazilianPhone, 'Informe um telefone válido com DDD.').nullable(),
    ),
    documentType: z.preprocess((value) => (value === '' ? null : value), organizationDocumentTypeSchema.nullable()),
    document: z.preprocess(nullableDigits, z.string().nullable()),
    addressLine1: z.preprocess(
      nullableText,
      z.string().max(150, 'O endereço deve ter no máximo 150 caracteres.').nullable(),
    ),
    addressLine2: z.preprocess(
      nullableText,
      z.string().max(100, 'O complemento deve ter no máximo 100 caracteres.').nullable(),
    ),
    city: z.preprocess(nullableText, z.string().max(100, 'A cidade deve ter no máximo 100 caracteres.').nullable()),
    state: z.preprocess(
      (value) => {
        if (typeof value !== 'string') {
          return value;
        }

        return value.trim().toUpperCase() || null;
      },
      z
        .string()
        .regex(/^[A-Z]{2}$/, 'Informe a sigla do estado com 2 letras.')
        .nullable(),
    ),
    postalCode: z.preprocess(
      nullableDigits,
      z
        .string()
        .regex(/^\d{8}$/, 'Informe um CEP com 8 dígitos.')
        .nullable(),
    ),
  })
  .superRefine((data, context) => {
    if ((data.documentType === null) !== (data.document === null)) {
      context.addIssue({
        code: 'custom',
        path: ['document'],
        message: 'Informe o tipo e o número do documento.',
      });

      return;
    }

    if (data.documentType === 'CPF' && data.document !== null && !/^\d{11}$/.test(data.document)) {
      context.addIssue({
        code: 'custom',
        path: ['document'],
        message: 'Informe um CPF com 11 dígitos.',
      });
    }

    if (data.documentType === 'CNPJ' && data.document !== null && !/^\d{14}$/.test(data.document)) {
      context.addIssue({
        code: 'custom',
        path: ['document'],
        message: 'Informe um CNPJ com 14 dígitos.',
      });
    }
  });
