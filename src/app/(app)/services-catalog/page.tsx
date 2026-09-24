import type { Metadata } from 'next';

import { CatalogServicesContent } from '@/modules/serviceCatalog/components/catalogServicesContent';

export const metadata: Metadata = {
  title: 'Catálogo de serviços',
};

export default function ServicesPage() {
  return <CatalogServicesContent />;
}
