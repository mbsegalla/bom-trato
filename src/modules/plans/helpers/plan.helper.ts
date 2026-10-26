import type { Plan, PlanPrice } from '../types/plan.types';

export interface SelectedPlan {
  plan: Plan;
  price: PlanPrice;
}

export function findSelectedPlan(plans: Plan[], planPriceId: string): SelectedPlan | null {
  for (const plan of plans) {
    const price = plan.prices.find((item) => item.id === planPriceId);

    if (price) {
      return {
        plan,
        price,
      };
    }
  }

  return null;
}
