import type { z } from 'zod';

import type {
  createdReceivablePaymentLinkSchema,
  publicReceivablePaymentLinkSchema,
  receivablePaymentLinkStatusSchema,
} from '../schemas/receivablePaymentLink.schema';

export type CreatedReceivablePaymentLink = z.infer<typeof createdReceivablePaymentLinkSchema>;
export type PublicReceivablePaymentLink = z.infer<typeof publicReceivablePaymentLinkSchema>;
export type ReceivablePaymentLinkStatus = z.infer<typeof receivablePaymentLinkStatusSchema>;
