import type { z } from 'zod';

import type {
  createReceivableFormSchema,
  receivableCancelFormSchema,
  receivableFinancialSchema,
  receivableListStatusSchema,
  receivablePaymentFormSchema,
  receivablePaymentMethodSchema,
  receivablePaymentSchema,
  receivablePaymentsResponseSchema,
  receivableReversePaymentFormSchema,
  receivableSchema,
  receivablesResponseSchema,
  receivableStatusSchema,
  updateReceivableFormSchema,
} from '../schemas/receivable.schema';

export type ReceivableStatus = z.infer<typeof receivableStatusSchema>;

export type ReceivableListStatus = z.infer<typeof receivableListStatusSchema>;

export type ReceivablePaymentMethod = z.infer<typeof receivablePaymentMethodSchema>;

export type Receivable = z.infer<typeof receivableSchema>;

export type ReceivablePayment = z.infer<typeof receivablePaymentSchema>;

export type ReceivablePage = z.infer<typeof receivablesResponseSchema>;

export type ReceivablePaymentsPage = z.infer<typeof receivablePaymentsResponseSchema>;

export type ReceivableFinancial = z.infer<typeof receivableFinancialSchema>;

export type CreateReceivableInput = z.output<typeof createReceivableFormSchema>;

export type UpdateReceivableInput = z.output<typeof updateReceivableFormSchema>;

export type ReceivablePaymentInput = z.output<typeof receivablePaymentFormSchema>;

export type ReceivableCancelInput = z.output<typeof receivableCancelFormSchema>;

export type ReceivableReversePaymentInput = z.output<typeof receivableReversePaymentFormSchema>;

export interface ReceivableListParams {
  page: number;
  limit?: number;
  status: ReceivableListStatus;
  customerId?: string;
  workOrderId?: string;
  overdue?: boolean;
}

export interface ReceivablePaymentResult {
  receivable: Receivable;
  payment: ReceivablePayment;
}
