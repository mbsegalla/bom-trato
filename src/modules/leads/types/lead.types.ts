import type { z } from 'zod';

import type {
  convertLeadResponseSchema,
  leadSchema,
  leadsResponseSchema,
  leadStatusSchema,
  publicLeadFormSchema,
} from '../schemas/lead.schema';

export type Lead = z.infer<typeof leadSchema>;
export type LeadStatus = z.infer<typeof leadStatusSchema>;
export type LeadPage = z.infer<typeof leadsResponseSchema>;
export type PublicLeadFormInput = z.output<typeof publicLeadFormSchema>;
export type ConvertLeadResult = z.infer<typeof convertLeadResponseSchema>;

export interface LeadListParams {
  page: number;
  limit?: number;
  status?: LeadStatus;
  search?: string;
}
