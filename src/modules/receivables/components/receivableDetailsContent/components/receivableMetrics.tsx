import type { Receivable } from '@/modules/receivables/types/receivable.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

export function ReceivableMetrics({ receivable }: { receivable: Receivable }) {
  return (
    <section className="mt-8 grid border-y border-border sm:grid-cols-2 xl:grid-cols-4">
      <div className="py-5 sm:pr-5">
        <p className="text-xs text-muted-foreground">Valor total</p>
        <p className="mt-1 text-xl font-semibold">{formatBrlCurrency(receivable.amountInCents)}</p>
      </div>

      <div className="border-t border-border py-5 sm:border-t-0 sm:border-l sm:pl-5 xl:px-5">
        <p className="text-xs text-muted-foreground">Recebido</p>
        <p className="mt-1 text-xl font-semibold text-success">{formatBrlCurrency(receivable.receivedInCents)}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:px-5">
        <p className="text-xs text-muted-foreground">Saldo</p>
        <p className="mt-1 text-xl font-semibold text-primary">{formatBrlCurrency(receivable.balanceInCents)}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:pl-5">
        <p className="text-xs text-muted-foreground">Vencimento</p>
        <p className="mt-1 text-xl font-semibold">{formatDate(receivable.dueAt)}</p>
      </div>
    </section>
  );
}
