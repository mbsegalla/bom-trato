import type { Metadata } from 'next';

import { QuotesContent } from '@/modules/quotes/components/quotesContent';

export const metadata: Metadata = {
  title: 'Orçamentos',
};

export default function QuotesPage() {
  return <QuotesContent />;
}
