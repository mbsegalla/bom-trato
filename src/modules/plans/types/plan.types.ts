import type { z } from 'zod';

import type { ServiceResult } from '@/shared/types/serviceResult';

import type { planPriceSchema, planSchema } from '../schemas/plan.schema';

export type PlanPrice = z.infer<typeof planPriceSchema>;

export type Plan = z.infer<typeof planSchema>;

export type PricingInterval = PlanPrice['interval'];

export type PlanListResult = ServiceResult<{ plans: Plan[] }>;
