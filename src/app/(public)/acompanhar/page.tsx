import type { Metadata } from 'next';

import { PublicWorkOrderContent } from '@/modules/workOrders/components/publicWorkOrderContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Acompanhamento de atendimento',
  description: 'Portal privado de acompanhamento de serviços.',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function PublicWorkOrderPage() {
  return <PublicWorkOrderContent />;
}
