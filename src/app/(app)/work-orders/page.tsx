import type { Metadata } from 'next';

import { WorkOrdersContent } from '@/modules/workOrders/components/workOrdersContent';

export const metadata: Metadata = {
  title: 'Ordens de serviço',
};

export default function WorkOrdersPage() {
  return <WorkOrdersContent />;
}
