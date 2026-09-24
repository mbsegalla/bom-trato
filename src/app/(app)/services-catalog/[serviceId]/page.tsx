import type { Metadata } from 'next';

import { CatalogServiceDetailsContent } from '@/modules/serviceCatalog/components/catalogServiceDetailsContent';

export const metadata: Metadata = {
  title: 'Serviço',
};

interface CatalogServiceDetailsPageProps {
  params: Promise<{ serviceId: string }>;
}

export default async function CatalogServiceDetailsPage({ params }: CatalogServiceDetailsPageProps) {
  const { serviceId } = await params;

  return <CatalogServiceDetailsContent serviceId={serviceId} />;
}
