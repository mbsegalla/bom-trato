import type { z } from 'zod';

import type {
  publicWorkOrderPhotoSchema,
  workOrderPhotoFormSchema,
  workOrderPhotoSchema,
  workOrderPhotoStageSchema,
} from '../schemas/workOrderPhoto.schema';

export type WorkOrderPhoto = z.infer<typeof workOrderPhotoSchema>;
export type WorkOrderPhotoStage = z.infer<typeof workOrderPhotoStageSchema>;
export type WorkOrderPhotoInput = z.infer<typeof workOrderPhotoFormSchema>;
export type PublicWorkOrderPhoto = z.infer<typeof publicWorkOrderPhotoSchema>;

export type WorkOrderPhotoSource =
  { kind: 'private'; organizationId: string; workOrderId: string } | { kind: 'public'; token: string };
