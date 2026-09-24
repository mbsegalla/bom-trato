import type { z } from 'zod';

import type {
  customerFormSchema,
  customerOverviewSchema,
  customerSchema,
  customersResponseSchema,
  customerStatusSchema,
} from '../schemas/customer.schema';

export type Customer = z.infer<typeof customerSchema>;

export type CustomerStatus = z.infer<typeof customerStatusSchema>;

export type CustomerFormInput = z.infer<typeof customerFormSchema>;

export type CustomerPage = z.infer<typeof customersResponseSchema>;

export type CustomerOverview = z.infer<typeof customerOverviewSchema>;

export interface CustomerListParams {
  page: number;
  limit?: number;
  search?: string;
  status: CustomerStatus;
}
