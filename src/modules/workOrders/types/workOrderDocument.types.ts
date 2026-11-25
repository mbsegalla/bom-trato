import type { z } from 'zod';

import type { workOrderWarrantyFormSchema, workOrderWarrantySchema } from '../schemas/workOrderDocument.schema';

export type WorkOrderWarranty = z.infer<typeof workOrderWarrantySchema>;
export type WorkOrderWarrantyInput = z.infer<typeof workOrderWarrantyFormSchema>;

export interface WorkOrderWarrantyResult {
  warranty: WorkOrderWarranty | null;
  locked: boolean;
}

export interface WorkOrderReportFile {
  blob: Blob;
  filename: string;
}
