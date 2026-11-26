import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

export const pixKeyTypeSchema = z.enum(['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'EVP']);

const versionSchema = z.number().int().min(0).max(2147483647);

export const receivingSettingsSchema = z
  .object({
    pixEnabled: z.boolean(),
    pixKeyType: pixKeyTypeSchema.nullable(),
    pixKey: z.string().min(1).max(77).nullable(),
    merchantName: z.string().min(1).max(25).nullable(),
    merchantCity: z.string().min(1).max(15).nullable(),
    version: versionSchema,
    canConfigure: z.boolean(),
    encryptionAvailable: z.boolean(),
  })
  .refine((data) => {
    const fields = [data.pixKeyType, data.pixKey, data.merchantName, data.merchantCity];

    return (
      (!data.canConfigure || data.encryptionAvailable) &&
      (data.pixEnabled ? data.version > 0 && fields.every((value) => value !== null) : fields.every((value) => value === null))
    );
  });

export const receivingSettingsResponseSchema = apiResponseSchema(receivingSettingsSchema);

export const receivingSettingsFormSchema = z.discriminatedUnion('pixEnabled', [
  z.object({
    pixEnabled: z.literal(true),
    pixKeyType: pixKeyTypeSchema,
    pixKey: z.string().trim().min(1, 'Informe a chave Pix.').max(150),
    merchantName: z.string().trim().min(1, 'Informe o nome do recebedor.').max(25),
    merchantCity: z.string().trim().min(1, 'Informe a cidade do recebedor.').max(15),
    confirmed: z.literal(true, 'Confirme que conferiu os dados da conta recebedora.'),
    version: versionSchema,
  }),
  z.object({
    pixEnabled: z.literal(false),
    pixKeyType: z.null(),
    pixKey: z.null(),
    merchantName: z.null(),
    merchantCity: z.null(),
    confirmed: z.literal(false),
    version: versionSchema,
  }),
]);
