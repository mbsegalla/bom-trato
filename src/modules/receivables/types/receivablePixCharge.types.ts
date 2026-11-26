import type { z } from 'zod';

import type { receivablePixChargeSchema } from '../schemas/receivablePixCharge.schema';

export type ReceivablePixCharge = z.infer<typeof receivablePixChargeSchema>;
