import type { z } from 'zod';

import type {
  publicWorkOrderDetailsSchema,
  publicWorkOrderFinancialSchema,
  publicWorkOrderItemSchema,
  publicWorkOrderOrganizationSchema,
  publicWorkOrderSchema,
  publicWorkOrderTimelineEventSchema,
  publicWorkOrderTimelineEventTypeSchema,
  workOrderShareSchema,
  workOrderShareStatusSchema,
} from '../schemas/workOrderPortal.schema';

export type WorkOrderShare = z.infer<typeof workOrderShareSchema>;
export type WorkOrderShareStatus = z.infer<typeof workOrderShareStatusSchema>;
export type PublicWorkOrder = z.infer<typeof publicWorkOrderSchema>;
export type PublicWorkOrderDetails = z.infer<typeof publicWorkOrderDetailsSchema>;
export type PublicWorkOrderOrganization = z.infer<typeof publicWorkOrderOrganizationSchema>;
export type PublicWorkOrderItem = z.infer<typeof publicWorkOrderItemSchema>;
export type PublicWorkOrderFinancial = z.infer<typeof publicWorkOrderFinancialSchema>;
export type PublicWorkOrderTimelineEvent = z.infer<typeof publicWorkOrderTimelineEventSchema>;
export type PublicWorkOrderTimelineEventType = z.infer<typeof publicWorkOrderTimelineEventTypeSchema>;
export type WorkOrderShareDuration = 7 | 15 | 30;
