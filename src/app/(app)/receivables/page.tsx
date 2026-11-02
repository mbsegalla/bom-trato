import type { Metadata } from 'next';

import { ReceivablesContent } from '@/modules/receivables/components/receivablesContent';

export const metadata: Metadata = {
  title: 'Recebíveis',
};

interface ReceivablesPageProps {
  searchParams: Promise<{ workOrderId?: string | string[] }>;
}

export default async function ReceivablesPage({ searchParams }: ReceivablesPageProps) {
  const params = await searchParams;

  const workOrderId =
    typeof params.workOrderId === 'string' && params.workOrderId.trim().length > 0
      ? params.workOrderId.trim()
      : undefined;

  return <ReceivablesContent workOrderId={workOrderId} />;
}
