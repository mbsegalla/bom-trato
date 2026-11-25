import type { z } from 'zod';

import type {
  publicWorkOrderChecklistItemSchema,
  publicWorkOrderChecklistSchema,
  workOrderChecklistFormSchema,
  workOrderChecklistItemSchema,
  workOrderChecklistSchema,
} from '../schemas/workOrderChecklist.schema';

export type WorkOrderChecklist = z.infer<typeof workOrderChecklistSchema>;
export type WorkOrderChecklistItem = z.infer<typeof workOrderChecklistItemSchema>;
export type WorkOrderChecklistInput = z.infer<typeof workOrderChecklistFormSchema>;
export type PublicWorkOrderChecklist = z.infer<typeof publicWorkOrderChecklistSchema>;
export type PublicWorkOrderChecklistItem = z.infer<typeof publicWorkOrderChecklistItemSchema>;

export interface WorkOrderChecklistUpdateInput {
  title?: string;
  completed?: boolean;
  visibleInPortal?: boolean;
}
