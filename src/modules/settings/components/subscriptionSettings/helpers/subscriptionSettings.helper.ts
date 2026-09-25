import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';

import type { CurrentPlan } from '../../../types/billing.types';

export function findCurrentPlan(plans: Plan[], planPriceId: string): CurrentPlan | null {
  for (const plan of plans) {
    const price = plan.prices.find((candidate: PlanPrice) => candidate.id === planPriceId);

    if (price) {
      return { plan, price };
    }
  }

  return null;
}
