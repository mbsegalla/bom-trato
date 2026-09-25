import { QuoteStatusBadge } from '@/modules/quotes/components/quoteStatusBadge';
import type { PublicQuote } from '@/modules/quotes/types/quote.types';

interface PublicQuoteHeaderProps {
  quote: PublicQuote;
}

export function PublicQuoteHeader({ quote }: PublicQuoteHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
          bt
        </span>

        <span className="text-xl font-bold tracking-tight">bom trato.</span>
      </div>

      <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
    </header>
  );
}
