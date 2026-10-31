import { ReceivableSummarySkeleton } from '@/modules/receivables/components/receivableSkeletons';
import type { ReceivableFinancial } from '@/modules/receivables/types/receivable.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

export function ReceivablesSummary({ financial }: { financial: ReceivableFinancial | null }) {
  if (!financial) return <ReceivableSummarySkeleton />;

  return (
    <section className="grid border-y border-border sm:grid-cols-2 xl:grid-cols-4">
      <div className="py-5 sm:pr-5">
        <p className="text-sm text-muted-foreground">A receber</p>

        <p className="mt-1 text-2xl font-semibold text-primary">
          {formatBrlCurrency(financial.currentReceivables.pendingAmountInCents)}
        </p>
      </div>

      <div className="border-t border-border py-5 sm:border-t-0 sm:border-l sm:pl-5 xl:px-5">
        <p className="text-sm text-muted-foreground">Em atraso</p>

        <p className="mt-1 text-2xl font-semibold text-warning">
          {formatBrlCurrency(financial.currentReceivables.overdueAmountInCents)}
        </p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:px-5">
        <p className="text-sm text-muted-foreground">Recebido no mês</p>

        <p className="mt-1 text-2xl font-semibold text-success">
          {formatBrlCurrency(financial.periodReceipts.amountInCents)}
        </p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:pl-5">
        <p className="text-sm text-muted-foreground">Pendências</p>
        <p className="mt-1 text-2xl font-semibold">{financial.currentReceivables.pendingCount}</p>
      </div>
    </section>
  );
}
