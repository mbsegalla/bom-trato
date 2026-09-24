import type { Metadata } from 'next';

import { PublicQuoteContent } from '@/modules/quotes/components/publicQuoteContent';

export const metadata: Metadata = {
  title: 'Orçamento',
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuoteSharePage() {
  return <PublicQuoteContent />;
}
