import {
  getQuoteDownPaymentAmountInCents,
  getQuotePaymentConditionDescription,
  getQuotePaymentConditionLabel,
} from '@/modules/quotes/constants/quote.constants';
import type { PublicQuote } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface PublicQuoteSummaryProps {
  quote: PublicQuote;
}

export function PublicQuoteSummary({ quote }: PublicQuoteSummaryProps) {
  const downPaymentInCents = getQuoteDownPaymentAmountInCents(quote.totalInCents, quote.downPaymentPercentage);

  const remainingBalanceInCents = quote.totalInCents - downPaymentInCents;

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

      <div className="mt-8 rounded-2xl bg-muted/40 p-5">
        <p className="text-sm font-medium">Condição de pagamento</p>

        <p className="mt-2 text-sm font-medium">{getQuotePaymentConditionLabel(quote.paymentCondition)}</p>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {getQuotePaymentConditionDescription(quote.paymentCondition, quote.downPaymentPercentage)}
        </p>

        {quote.paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' && (
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Entrada ({quote.downPaymentPercentage}%)</span>
              <span className="font-medium">{formatBrlCurrency(downPaymentInCents)}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Saldo restante</span>
              <span className="font-medium">{formatBrlCurrency(remainingBalanceInCents)}</span>
            </div>
          </div>
        )}
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
