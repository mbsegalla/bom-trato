import type { z } from 'zod';

import type { createReceivableSandboxPixSchema, receivableSandboxPixSchema } from '../schemas/receivableSandboxPix.schema';

export type ReceivableSandboxPix = z.infer<typeof receivableSandboxPixSchema>;
export type CreateReceivableSandboxPixInput = z.infer<typeof createReceivableSandboxPixSchema>;
