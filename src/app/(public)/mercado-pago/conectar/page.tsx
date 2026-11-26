import type { Metadata } from 'next';

import { MercadoPagoCallback } from '@/modules/settings/components/mercadoPagoCallback';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conectar Mercado Pago',
  referrer: 'no-referrer',
  robots: { index: false, follow: false, noarchive: true },
};

export default function MercadoPagoConnectionPage() {
  return <MercadoPagoCallback />;
}
