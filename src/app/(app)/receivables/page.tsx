import { Banknote } from 'lucide-react';
import type { Metadata } from 'next';

import { AppPlaceholder } from '@/modules/app/components/appPlaceholder';

export const metadata: Metadata = {
  title: 'Recebíveis',
};

export default function ReceivablesPage() {
  return (
    <AppPlaceholder
      icon={Banknote}
      title="Recebíveis"
      description="Aqui vamos acompanhar valores a receber, pagamentos registrados e cobranças em atraso."
    />
  );
}
