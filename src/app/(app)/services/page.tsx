import { Wrench } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Catálogo de serviços',
};

export default function ServicesPage() {
  return (
    <AppPlaceholder
      icon={Wrench}
      title="Catálogo de serviços"
      description="Aqui vamos organizar os serviços oferecidos pelo negócio, preços e informações usadas nos orçamentos."
    />
  );
}
