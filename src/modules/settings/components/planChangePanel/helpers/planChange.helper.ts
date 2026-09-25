import type { Plan, PlanPrice } from '@/modules/plans/types/plan.types';

export function findPlanPrice(plans: Plan[], planPriceId: string): { plan: Plan; price: PlanPrice } | null {
  for (const plan of plans) {
    const price = plan.prices.find((candidate) => candidate.id === planPriceId);

    if (price) {
      return { plan, price };
    }
  }

  return null;
}
