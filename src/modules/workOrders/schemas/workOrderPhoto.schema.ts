import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

import { WORK_ORDER_PHOTO_CAPTION_LIMIT, WORK_ORDER_PHOTO_STAGES } from '../constants/workOrderPhoto.constants';

export const workOrderPhotoStageSchema = z.enum(WORK_ORDER_PHOTO_STAGES);

export const publicWorkOrderPhotoSchema = z.object({
  id: z.uuid(),
  stage: workOrderPhotoStageSchema,
  caption: z.string().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  createdAt: z.coerce.date(),
});

export const workOrderPhotoSchema = publicWorkOrderPhotoSchema.extend({
  visibleInPortal: z.boolean(),
  sizeInBytes: z.number().int().positive(),
  version: z.number().int().positive(),
  updatedAt: z.coerce.date(),
});

export const workOrderPhotoFormSchema = z.object({
  stage: workOrderPhotoStageSchema,
  caption: z
    .string()
    .trim()
    .max(WORK_ORDER_PHOTO_CAPTION_LIMIT, 'A legenda deve ter no máximo 240 caracteres.')
    .transform((value) => value || null),
  visibleInPortal: z.boolean(),
});

export const workOrderPhotoResponseSchema = apiResponseSchema(workOrderPhotoSchema);

export const workOrderPhotosResponseSchema = apiResponseSchema(z.array(workOrderPhotoSchema));
