import type { Metadata } from 'next';

import { WorkOrderDetailsContent } from '@/modules/workOrders/components/workOrderDetailsContent';

export const metadata: Metadata = {
  title: 'Ordem de serviço',
};

interface WorkOrderDetailsPageProps {
  params: Promise<{ workOrderId: string }>;
}

export default async function WorkOrderDetailsPage({ params }: WorkOrderDetailsPageProps) {
  const { workOrderId } = await params;

  return <WorkOrderDetailsContent workOrderId={workOrderId} />;
}
