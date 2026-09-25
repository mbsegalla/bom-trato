import Link from 'next/link';

import type { Quote } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate, formatDateTime } from '@/shared/formatters/date.formatter';

export function QuoteSummarySidebar({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Resumo</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBrlCurrency(quote.subtotalInCents)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Desconto</span>
            <span>- {formatBrlCurrency(quote.discountInCents)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatBrlCurrency(quote.totalInCents)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Cliente</h2>
        <Link
          href={`/customers/${quote.customerId}`}
          className="mt-4 block font-medium hover:text-primary hover:underline"
        >
          {quote.customerName}
        </Link>
        {quote.customerEmail && <p className="mt-2 text-sm text-muted-foreground">{quote.customerEmail}</p>}
        {quote.customerPhone && <p className="mt-1 text-sm text-muted-foreground">{quote.customerPhone}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">Detalhes</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Validade</dt>
            <dd className="mt-1 font-medium">{formatDateTime(quote.validUntil)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Criado em</dt>
            <dd className="mt-1 font-medium">{formatDate(quote.createdAt)}</dd>
          </div>
        </dl>
        {quote.notes && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Observações</p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </section>
    </div>
  );
}
