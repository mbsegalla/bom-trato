import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
import { QuoteStatusBadge } from '@/modules/quotes/components/quoteStatusBadge';
import type { QuotePage } from '@/modules/quotes/types/quote.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

interface QuotesTableProps {
  data: QuotePage;
  page: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuotesTable({ data, page, onPrevious, onNext }: QuotesTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-220 border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Orçamento</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Validade</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Atualizado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((quote) => (
              <tr key={quote.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <Link href={`/quotes/${quote.id}`} className="font-medium hover:text-primary hover:underline">
                    {quote.title}
                  </Link>
                </td>

                <td className="px-5 py-3.5 text-sm">{quote.customerName}</td>

                <td className="px-5 py-3.5">
                  <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
                </td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(quote.validUntil)}</td>

                <td className="px-5 py-3.5 font-medium">{formatBrlCurrency(quote.totalInCents)}</td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(quote.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination page={page} hasMore={data.hasMore} onPrevious={onPrevious} onNext={onNext} />
    </>
  );
}
