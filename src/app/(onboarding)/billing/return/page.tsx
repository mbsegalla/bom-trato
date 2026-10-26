import type { Metadata } from 'next';

import { BillingReturn } from '@/modules/onboarding/components/billingReturn';
import { OnboardingPaymentMethodReturn } from '@/modules/onboarding/components/onboardingPaymentMethodReturn';
import { onboardingOrganizationIdSchema } from '@/modules/onboarding/schemas/onboarding.schema';

export const metadata: Metadata = {
  title: 'Confirmando cobrança | Bom Trato',
  robots: {
    index: false,
    follow: false,
  },
};

interface BillingReturnPageProps {
  searchParams: Promise<{
    organizationId?: string | string[];
    operationId?: string | string[];
    kind?: string | string[];
  }>;
}

export default async function BillingReturnPage({ searchParams }: BillingReturnPageProps) {
  const params = await searchParams;

  const organizationId = typeof params.organizationId === 'string' ? params.organizationId : null;
  const operationId = typeof params.operationId === 'string' ? params.operationId : null;
  const kind = typeof params.kind === 'string' ? params.kind : null;

  if (kind === 'payment-method' && organizationId && operationId) {
    const organizationResult = onboardingOrganizationIdSchema.safeParse(organizationId);
    const operationResult = onboardingOrganizationIdSchema.safeParse(operationId);

    if (organizationResult.success && operationResult.success) {
      return (
        <OnboardingPaymentMethodReturn organizationId={organizationResult.data} operationId={operationResult.data} />
      );
    }
  }

  return <BillingReturn />;
}
