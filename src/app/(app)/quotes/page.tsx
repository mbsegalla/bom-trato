import { FileText } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Orçamentos',
};

export default function QuotesPage() {
  return (
    <AppPlaceholder
      icon={FileText}
      title="Orçamentos"
      description="Aqui vamos criar, acompanhar, enviar e gerenciar os orçamentos do negócio."
    />
  );
}
