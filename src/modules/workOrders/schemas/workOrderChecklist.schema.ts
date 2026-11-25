import { z } from 'zod';

import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

import {
  WORK_ORDER_CHECKLIST_LIMIT,
  WORK_ORDER_CHECKLIST_TITLE_LIMIT,
} from '../constants/workOrderChecklist.constants';

export const publicWorkOrderChecklistItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  completed: z.boolean(),
  completedAt: z.coerce.date().nullable(),
});

export const workOrderChecklistItemSchema = publicWorkOrderChecklistItemSchema.extend({
  position: z.number().int().nonnegative(),
  completedById: z.uuid().nullable(),
  visibleInPortal: z.boolean(),
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const workOrderChecklistProgressSchema = z.object({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
});

export const workOrderChecklistSchema = z.object({
  items: z.array(workOrderChecklistItemSchema).max(WORK_ORDER_CHECKLIST_LIMIT),
  progress: workOrderChecklistProgressSchema,
});

export const publicWorkOrderChecklistSchema = z.object({
  items: z.array(publicWorkOrderChecklistItemSchema).max(WORK_ORDER_CHECKLIST_LIMIT),
  progress: workOrderChecklistProgressSchema,
});

export const workOrderChecklistFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título do item.')
    .max(WORK_ORDER_CHECKLIST_TITLE_LIMIT, 'O título deve ter no máximo 200 caracteres.'),
});

export const workOrderChecklistResponseSchema = apiResponseSchema(workOrderChecklistSchema);

export const workOrderChecklistItemResponseSchema = apiResponseSchema(workOrderChecklistItemSchema);
