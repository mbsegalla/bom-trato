import type { CustomerOverview } from '@/modules/customers/types/customer.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface CustomerMetricsProps {
  summary: CustomerOverview['summary'];
}

export function CustomerMetrics({ summary }: CustomerMetricsProps) {
  return (
    <section className="mt-8 grid border-y border-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className="py-5 sm:pr-5">
        <p className="text-xs text-muted-foreground">Orçamentos</p>
        <p className="mt-1 text-xl font-semibold">{summary.quoteCount}</p>
      </div>

      <div className="border-t border-border py-5 sm:border-t-0 sm:border-l sm:px-5">
        <p className="text-xs text-muted-foreground">Ordens de serviço</p>
        <p className="mt-1 text-xl font-semibold">{summary.workOrderCount}</p>
      </div>

      <div className="border-t border-border py-5 lg:border-t-0 lg:border-l lg:px-5">
        <p className="text-xs text-muted-foreground">Concluídos</p>
        <p className="mt-1 text-xl font-semibold text-success">{summary.completedWorkOrderCount}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:px-5">
        <p className="text-xs text-muted-foreground">A receber</p>
        <p className="mt-1 text-xl font-semibold text-primary">{formatBrlCurrency(summary.pendingAmountInCents)}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:px-5">
        <p className="text-xs text-muted-foreground">Em atraso</p>
        <p className="mt-1 text-xl font-semibold text-warning">{formatBrlCurrency(summary.overdueAmountInCents)}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:pl-5">
        <p className="text-xs text-muted-foreground">Recebido</p>
        <p className="mt-1 text-xl font-semibold text-success">{formatBrlCurrency(summary.receivedAmountInCents)}</p>
      </div>
    </section>
  );
}
