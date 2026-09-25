import { ChevronLeft, ChevronRight, WalletCards } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ReceivableStatusBadge } from '@/modules/receivables/components/receivableStatusBadge';
import type { ReceivablePage } from '@/modules/receivables/types/receivable.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

interface ReceivablesTableProps {
  data: ReceivablePage;
  page: number;
  refreshing: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function ReceivablesTable({ data, page, refreshing, onPreviousPage, onNextPage }: ReceivablesTableProps) {
  if (data.items.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
          <WalletCards className="size-6" />
        </div>
        <h2 className="mt-5 font-heading text-xl font-semibold">Nenhum recebível por aqui</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Recebíveis podem ser criados a partir das ordens de serviço concluídas.
        </p>
        <Link
          href="/work-orders"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Ver ordens de serviço
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        className={refreshing ? 'overflow-x-auto opacity-60 transition-opacity' : 'overflow-x-auto transition-opacity'}
      >
        <table className="w-full min-w-240 border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-6 py-3">Recebível</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Vencimento</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3">Recebido</th>
              <th className="px-6 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((receivable) => (
              <tr key={receivable.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <Link
                    href={`/receivables/${receivable.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {receivable.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{receivable.customerName}</p>
                </td>
                <td className="px-6 py-4">
                  <ReceivableStatusBadge status={receivable.status} overdue={receivable.overdue} />
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(receivable.dueAt)}</td>
                <td className="px-6 py-4 font-medium">{formatBrlCurrency(receivable.amountInCents)}</td>
                <td className="px-6 py-4 text-sm">{formatBrlCurrency(receivable.receivedInCents)}</td>
                <td className="px-6 py-4 font-semibold text-primary">{formatBrlCurrency(receivable.balanceInCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-border px-6 py-4">
        <p className="text-sm text-muted-foreground">Página {data.page}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={onPreviousPage}
            className="cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!data.hasMore}
            onClick={onNextPage}
            className="cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </>
  );
}
