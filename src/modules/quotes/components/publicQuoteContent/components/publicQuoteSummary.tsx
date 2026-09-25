import type { PublicQuote } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface PublicQuoteSummaryProps {
  quote: PublicQuote;
}

export function PublicQuoteSummary({ quote }: PublicQuoteSummaryProps) {
  return (
    <>
      <div className="mt-6 ml-auto max-w-sm space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatBrlCurrency(quote.subtotalInCents)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Desconto</span>
          <span>- {formatBrlCurrency(quote.discountInCents)}</span>
        </div>

        <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatBrlCurrency(quote.totalInCents)}</span>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-8 rounded-2xl bg-muted/40 p-5">
          <p className="text-sm font-medium">Observações</p>

          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{quote.notes}</p>
        </div>
      )}
    </>
  );
}
