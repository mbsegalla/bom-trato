import { listPlans } from '@/modules/plans/services/plan.service';

import { PricingSection } from './pricingSection';

export async function PublicPricingSection() {
  const result = await listPlans();

  return <PricingSection result={result} />;
}
