import type { z } from 'zod';

import type {
  workOrderCancelFormSchema,
  workOrderExecutionNotesFormSchema,
  workOrderItemSchema,
  workOrderListStatusSchema,
  workOrderPlanningFormSchema,
  workOrderScheduleFormSchema,
  workOrderScheduleHistoryItemSchema,
  workOrderScheduleHistoryResponseSchema,
  workOrderSchema,
  workOrdersResponseSchema,
  workOrderStatusHistorySchema,
  workOrderStatusSchema,
  workOrderSummarySchema,
} from '../schemas/workOrder.schema';

export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

export type WorkOrderListStatus = z.infer<typeof workOrderListStatusSchema>;

export type WorkOrderItem = z.infer<typeof workOrderItemSchema>;

export type WorkOrder = z.infer<typeof workOrderSchema>;

export type WorkOrderSummary = z.infer<typeof workOrderSummarySchema>;

export type WorkOrderPage = z.infer<typeof workOrdersResponseSchema>;

export type WorkOrderStatusHistory = z.infer<typeof workOrderStatusHistorySchema>;

export type WorkOrderScheduleHistoryItem = z.infer<typeof workOrderScheduleHistoryItemSchema>;

export type WorkOrderScheduleHistoryPage = z.infer<typeof workOrderScheduleHistoryResponseSchema>;

export type WorkOrderPlanningInput = z.output<typeof workOrderPlanningFormSchema>;

export type WorkOrderScheduleInput = z.output<typeof workOrderScheduleFormSchema>;

export type WorkOrderExecutionNotesInput = z.output<typeof workOrderExecutionNotesFormSchema>;

export type WorkOrderCancelInput = z.output<typeof workOrderCancelFormSchema>;

export interface WorkOrderListParams {
  page: number;
  limit?: number;
  status: WorkOrderListStatus;
  customerId?: string;
  assignedToId?: string;
}
