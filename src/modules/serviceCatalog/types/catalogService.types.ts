import type { z } from 'zod';

import type {
  catalogServiceFormSchema,
  catalogServiceSchema,
  catalogServicesResponseSchema,
  catalogServiceStatusSchema,
  serviceUnitSchema,
} from '../schemas/catalogService.schema';

export type ServiceUnit = z.infer<typeof serviceUnitSchema>;

export type CatalogServiceStatus = z.infer<typeof catalogServiceStatusSchema>;

export type CatalogService = z.infer<typeof catalogServiceSchema>;

export type CatalogServiceInput = z.output<typeof catalogServiceFormSchema>;

export type CatalogServicePage = z.infer<typeof catalogServicesResponseSchema>;

export interface CatalogServiceListParams {
  page: number;
  limit?: number;
  search?: string;
  status: CatalogServiceStatus;
}
