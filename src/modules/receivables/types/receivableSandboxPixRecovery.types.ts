import type { z } from 'zod';

import type {
  receivableSandboxPixRecoverySchema,
  sandboxPixRecoveryStatusSchema,
} from '../schemas/receivableSandboxPixRecovery.schema';

export type ReceivableSandboxPixRecovery = z.infer<typeof receivableSandboxPixRecoverySchema>;
export type SandboxPixRecoveryStatus = z.infer<typeof sandboxPixRecoveryStatusSchema>;
