import { ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Ordens de serviço',
};

export default function WorkOrdersPage() {
  return (
    <AppPlaceholder
      icon={ClipboardList}
      title="Ordens de serviço"
      description="Aqui vamos acompanhar os serviços aprovados desde o planejamento até a conclusão."
    />
  );
}
