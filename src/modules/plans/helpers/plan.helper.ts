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

export function getPlanUserLimitLabel(plan: Plan): string {
  if (plan.maxUsers > 999) {
    return 'Usuários ilimitados';
  }

  if (plan.maxUsers === 1) {
    return 'Até 1 usuário';
  }

  return `Até ${plan.maxUsers.toLocaleString('pt-BR')} usuários`;
}
