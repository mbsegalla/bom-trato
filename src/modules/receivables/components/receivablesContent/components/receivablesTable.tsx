import { WalletCards } from 'lucide-react';
import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
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
      <div className="border-b border-border py-10">
        <WalletCards aria-hidden="true" className="size-6 text-primary" />

        <h2 className="mt-4 font-heading text-lg font-semibold">Nenhum recebível por aqui</h2>

        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Recebíveis podem ser criados a partir das ordens de serviço concluídas.
        </p>

        <Link
          href="/work-orders"
          className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
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
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Recebível</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Vencimento</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Recebido</th>
              <th className="px-5 py-3">Saldo</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((receivable) => (
              <tr key={receivable.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/receivables/${receivable.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {receivable.title}
                  </Link>

                  <p className="mt-1 text-sm text-muted-foreground">{receivable.customerName}</p>
                </td>

                <td className="px-5 py-3.5">
                  <ReceivableStatusBadge status={receivable.status} overdue={receivable.overdue} />
                </td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(receivable.dueAt)}</td>

                <td className="px-5 py-3.5 font-medium">{formatBrlCurrency(receivable.amountInCents)}</td>

                <td className="px-5 py-3.5 text-sm">{formatBrlCurrency(receivable.receivedInCents)}</td>

                <td className="px-5 py-3.5 font-semibold text-primary">
                  {formatBrlCurrency(receivable.balanceInCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        hasMore={data.hasMore}
        disabled={refreshing}
        onPrevious={onPreviousPage}
        onNext={onNextPage}
      />
    </>
  );
}
