import Link from 'next/link';

import type { Quote } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate, formatDateTime } from '@/shared/formatters/date.formatter';

export function QuoteSummarySidebar({ quote }: { quote: Quote }) {
  return (
    <aside className="rounded-xl bg-muted/40 p-5 ring-1 ring-border/60">
      <section>
        <h2 className="font-heading text-lg font-semibold">Resumo</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBrlCurrency(quote.subtotalInCents)}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Desconto</span>
            <span>- {formatBrlCurrency(quote.discountInCents)}</span>
          </div>

          <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatBrlCurrency(quote.totalInCents)}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 border-t border-border pt-6">
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

      <section className="mt-6 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">Detalhes</h2>

        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Validade</dt>
            <dd className="mt-1 font-medium">{formatDateTime(quote.validUntil)}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted-foreground">Criado em</dt>
            <dd className="mt-1 font-medium">{formatDate(quote.createdAt)}</dd>
          </div>
        </dl>
      </section>

      {quote.notes && (
        <section className="mt-6 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold">Observações</h2>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{quote.notes}</p>
        </section>
      )}
    </aside>
  );
}
