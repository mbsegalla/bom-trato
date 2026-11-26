import type { z } from 'zod';

import type {
  mercadoPagoCompletionSchema,
  mercadoPagoConnectionSchema,
  mercadoPagoStartSchema,
} from '../schemas/mercadoPagoConnection.schema';

export type MercadoPagoConnectionView = z.infer<typeof mercadoPagoConnectionSchema>;
export type MercadoPagoStartView = z.infer<typeof mercadoPagoStartSchema>;
export type MercadoPagoCompletionView = z.infer<typeof mercadoPagoCompletionSchema>;
