import type { Metadata } from 'next';

import { QuoteDetailsContent } from '@/modules/quotes/components/quoteDetailsContent';

export const metadata: Metadata = {
  title: 'Orçamento',
};

interface QuoteDetailsPageProps {
  params: Promise<{ quoteId: string }>;
}

export default async function QuoteDetailsPage({ params }: QuoteDetailsPageProps) {
  const { quoteId } = await params;

  return <QuoteDetailsContent quoteId={quoteId} />;
}
