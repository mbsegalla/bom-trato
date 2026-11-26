import type { Metadata } from 'next';

import { PublicReceivablePaymentContent } from '@/modules/receivables/components/publicReceivablePaymentContent';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pagamento Pix',
  description: 'Página privada de pagamento.',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function PublicReceivablePaymentPage() {
  return <PublicReceivablePaymentContent />;
}
