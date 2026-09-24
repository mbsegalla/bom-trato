import type { Metadata } from 'next';

import { ReceivablesContent } from '@/modules/receivables/components/receivablesContent';

export const metadata: Metadata = {
  title: 'Recebíveis',
};

export default function ReceivablesPage() {
  return <ReceivablesContent />;
}
