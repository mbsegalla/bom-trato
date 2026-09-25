import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
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
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-6 py-3">Orçamento</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Validade</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Atualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((quote) => (
              <tr key={quote.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <Link href={`/quotes/${quote.id}`} className="font-medium hover:text-primary hover:underline">
                    {quote.title}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">{quote.customerName}</td>
                <td className="px-6 py-4">
                  <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(quote.validUntil)}</td>
                <td className="px-6 py-4 font-medium">{formatBrlCurrency(quote.totalInCents)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(quote.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between border-t border-border px-6 py-4">
        <p className="text-sm text-muted-foreground">Página {data.page}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={onPrevious} className="cursor-pointer">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={!data.hasMore} onClick={onNext} className="cursor-pointer">
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </footer>
    </>
  );
}
