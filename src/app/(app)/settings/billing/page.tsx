import type { Metadata } from 'next';

import { BillingPortalReturn } from '@/modules/settings/components/billingPortalReturn';

export const metadata: Metadata = {
  title: 'Faturamento',
  robots: {
    index: false,
    follow: false,
  },
};

interface BillingPageProps {
  searchParams: Promise<{ organizationId?: string | string[] }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const { organizationId } = await searchParams;

  return <BillingPortalReturn organizationId={typeof organizationId === 'string' ? organizationId : null} />;
}
