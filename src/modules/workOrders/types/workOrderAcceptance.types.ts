import type { z } from 'zod';

import type {
  publicWorkOrderAcceptanceReceiptSchema,
  publicWorkOrderAcceptanceSchema,
  workOrderAcceptanceFormSchema,
  workOrderAcceptanceReceiptSchema,
  workOrderAcceptanceSnapshotSchema,
  workOrderAcceptanceStatusSchema,
} from '../schemas/workOrderAcceptance.schema';

export type PublicWorkOrderAcceptance = z.infer<typeof publicWorkOrderAcceptanceSchema>;
export type PublicWorkOrderAcceptanceReceipt = z.infer<typeof publicWorkOrderAcceptanceReceiptSchema>;
export type WorkOrderAcceptanceInput = z.infer<typeof workOrderAcceptanceFormSchema>;
export type WorkOrderAcceptanceReceipt = z.infer<typeof workOrderAcceptanceReceiptSchema>;
export type WorkOrderAcceptanceSnapshot = z.infer<typeof workOrderAcceptanceSnapshotSchema>;
export type WorkOrderAcceptanceStatus = z.infer<typeof workOrderAcceptanceStatusSchema>;
