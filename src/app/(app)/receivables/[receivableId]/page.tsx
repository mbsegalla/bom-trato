import type { Metadata } from 'next';

import { ReceivableDetailsContent } from '@/modules/receivables/components/receivableDetailsContent';

export const metadata: Metadata = {
  title: 'Recebível',
};

interface ReceivableDetailsPageProps {
  params: Promise<{ receivableId: string }>;
}

export default async function ReceivableDetailsPage({ params }: ReceivableDetailsPageProps) {
  const { receivableId } = await params;

  return <ReceivableDetailsContent receivableId={receivableId} />;
}
