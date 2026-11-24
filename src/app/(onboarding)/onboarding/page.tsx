import type { Metadata } from 'next';

import { OnboardingContent } from '@/modules/onboarding/components/onboardingContent';
import { onboardingOrganizationIdSchema } from '@/modules/onboarding/schemas/onboarding.schema';

export const metadata: Metadata = {
  title: 'Configurar conta',
  robots: {
    index: false,
    follow: false,
  },
};

interface OnboardingPageProps {
  searchParams: Promise<{
    organizationId?: string | string[];
    subscribe?: string | string[];
  }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;

  const organization = onboardingOrganizationIdSchema.safeParse(params.organizationId);
  const organizationId = organization.success ? organization.data : undefined;
  const subscriptionMode = organizationId !== undefined && params.subscribe === '1';

  return (
    <OnboardingContent
      key={`${organizationId ?? 'default'}:${subscriptionMode}`}
      organizationId={organizationId}
      subscriptionMode={subscriptionMode}
    />
  );
}
