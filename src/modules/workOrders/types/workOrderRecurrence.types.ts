import type { z } from 'zod';

import type {
  workOrderRecurrenceFormSchema,
  workOrderRecurrenceSchema,
  workOrderRecurrenceUnitSchema,
  workOrderRecurrenceViewSchema,
} from '../schemas/workOrderRecurrence.schema';

export type WorkOrderRecurrenceUnit = z.infer<typeof workOrderRecurrenceUnitSchema>;
export type WorkOrderRecurrenceInput = z.infer<typeof workOrderRecurrenceFormSchema>;
export type WorkOrderRecurrence = z.infer<typeof workOrderRecurrenceSchema>;
export type WorkOrderRecurrenceView = z.infer<typeof workOrderRecurrenceViewSchema>;
