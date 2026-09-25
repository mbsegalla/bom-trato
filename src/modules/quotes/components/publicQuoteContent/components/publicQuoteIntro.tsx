import type { PublicQuote } from '@/modules/quotes/types/quote.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

interface PublicQuoteIntroProps {
  quote: PublicQuote;
}

export function PublicQuoteIntro({ quote }: PublicQuoteIntroProps) {
  return (
    <div className="border-b border-border p-6 sm:p-8">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">{quote.organizationName}</p>

      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight">{quote.title}</h1>

      <p className="mt-3 text-muted-foreground">Preparado para {quote.customerName}</p>

      {quote.validUntil && (
        <p className="mt-2 text-sm text-muted-foreground">Válido até {formatDateTime(quote.validUntil)}</p>
      )}
    </div>
  );
}
