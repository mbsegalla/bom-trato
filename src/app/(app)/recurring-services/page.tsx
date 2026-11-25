import type { Metadata } from 'next';

import { WorkOrderRecurrencesContent } from '@/modules/workOrders/components/workOrderRecurrencesContent';

export const metadata: Metadata = {
  title: 'Serviços recorrentes',
};

export default function RecurringServicesPage() {
  return <WorkOrderRecurrencesContent />;
}
