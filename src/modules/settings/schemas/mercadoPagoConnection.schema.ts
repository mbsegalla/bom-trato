import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const accountIdSchema = z.string().regex(/^[1-9]\d{0,29}$/);
const dateSchema = z.iso.datetime().transform((value) => new Date(value));

export const mercadoPagoConnectionSchema = z.object({
  available: z.boolean(),
  liveMode: z.boolean(),
  canConnect: z.boolean(),
  canDisconnect: z.boolean(),
  status: z.enum(['NOT_CONNECTED', 'CONNECTED', 'EXPIRED', 'DISCONNECTED', 'RECONNECT_REQUIRED']),
  accountId: accountIdSchema.nullable(),
  connectedAt: dateSchema.nullable(),
  expiresAt: dateSchema.nullable(),
});

export const mercadoPagoStartSchema = z.object({
  authorizationUrl: z.url(),
  expiresAt: dateSchema,
});

export const mercadoPagoCompletionSchema = z.object({
  organizationId: z.uuid(),
  organizationName: z.string().min(1).max(100),
  accountId: accountIdSchema,
  liveMode: z.boolean(),
});

export const mercadoPagoConnectionResponseSchema = apiResponseSchema(mercadoPagoConnectionSchema);
export const mercadoPagoStartResponseSchema = apiResponseSchema(mercadoPagoStartSchema);
export const mercadoPagoCompletionResponseSchema = apiResponseSchema(mercadoPagoCompletionSchema);
