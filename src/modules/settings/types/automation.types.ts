import type { z } from 'zod';

import type { automationEventSchema } from '../schemas/automation.schema';

export type AutomationEvent = z.infer<typeof automationEventSchema>;
