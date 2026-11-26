import type { z } from 'zod';

import type { createReceivableLivePixSchema, receivableLivePixSchema } from '../schemas/receivableLivePix.schema';

export type ReceivableLivePix = z.infer<typeof receivableLivePixSchema>;
export type CreateReceivableLivePixInput = z.infer<typeof createReceivableLivePixSchema>;
