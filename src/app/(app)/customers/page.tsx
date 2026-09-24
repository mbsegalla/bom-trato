import { Users } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Clientes',
};

export default function CustomersPage() {
  return (
    <AppPlaceholder
      icon={Users}
      title="Clientes"
      description="Aqui vamos organizar o cadastro, histórico e visão completa dos seus clientes."
    />
  );
}
