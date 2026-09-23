import type { Metadata } from 'next';

import { BillingReturn } from '@/modules/onboarding/components/billingReturn';

export const metadata: Metadata = {
  title: 'Confirmando pagamento | Bom Trato',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BillingReturnPage() {
  return <BillingReturn />;
}
