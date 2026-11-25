import type { z } from 'zod';

import type {
  workOrderRecurrenceFormSchema,
  workOrderRecurrenceListItemSchema,
  workOrderRecurrenceListSchema,
  workOrderRecurrenceListStatusSchema,
  workOrderRecurrenceSchema,
  workOrderRecurrenceUnitSchema,
  workOrderRecurrenceViewSchema,
  workOrderRecurrenceVisitPeriodSchema,
} from '../schemas/workOrderRecurrence.schema';

export type WorkOrderRecurrenceUnit = z.infer<typeof workOrderRecurrenceUnitSchema>;
export type WorkOrderRecurrenceInput = z.infer<typeof workOrderRecurrenceFormSchema>;
export type WorkOrderRecurrence = z.infer<typeof workOrderRecurrenceSchema>;
export type WorkOrderRecurrenceView = z.infer<typeof workOrderRecurrenceViewSchema>;

export type WorkOrderRecurrenceListStatus = z.infer<typeof workOrderRecurrenceListStatusSchema>;
export type WorkOrderRecurrenceVisitPeriod = z.infer<typeof workOrderRecurrenceVisitPeriodSchema>;
export type WorkOrderRecurrenceListItem = z.infer<typeof workOrderRecurrenceListItemSchema>;
export type WorkOrderRecurrenceList = z.infer<typeof workOrderRecurrenceListSchema>;

export interface WorkOrderRecurrenceListParams {
  page: number;
  limit?: number;
  status: WorkOrderRecurrenceListStatus;
  visit: WorkOrderRecurrenceVisitPeriod;
  customerName: string;
}
