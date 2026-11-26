import type { z } from 'zod';

import type {
  pixKeyTypeSchema,
  receivingSettingsFormSchema,
  receivingSettingsSchema,
} from '../schemas/receivingSettings.schema';

export type PixKeyType = z.infer<typeof pixKeyTypeSchema>;
export type ReceivingSettingsView = z.infer<typeof receivingSettingsSchema>;
export type SaveReceivingSettingsInput = z.output<typeof receivingSettingsFormSchema>;
