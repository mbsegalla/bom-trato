import type { Metadata } from 'next';

import { CustomerDetailsContent } from '@/modules/customers/components/customerDetailsContent';

export const metadata: Metadata = {
  title: 'Cliente',
};

interface CustomerDetailsPageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { customerId } = await params;

  return <CustomerDetailsContent customerId={customerId} />;
}
