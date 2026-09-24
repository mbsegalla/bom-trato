import type { Metadata } from 'next';

import { DashboardContent } from '@/modules/dashboard/components/dashboardContent';

export const metadata: Metadata = {
  title: 'Visão geral',
};

export default function DashboardPage() {
  return <DashboardContent />;
}
