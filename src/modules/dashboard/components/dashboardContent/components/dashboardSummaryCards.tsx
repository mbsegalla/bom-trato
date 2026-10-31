import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface DashboardSummaryCardsProps {
  data: DashboardData;
}

export function DashboardSummaryCards({ data }: DashboardSummaryCardsProps) {
  return (
    <section className="mt-8 grid border-y border-border md:grid-cols-3">
      <div className="py-5 md:pr-6">
        <p className="text-sm text-muted-foreground">Recebido no mês</p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
          {formatBrlCurrency(data.financial.periodReceipts.amountInCents)}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {data.financial.periodReceipts.count}{' '}
          {data.financial.periodReceipts.count === 1 ? 'pagamento registrado' : 'pagamentos registrados'}
        </p>
      </div>

      <div className="border-t border-border py-5 md:border-t-0 md:border-l md:px-6">
        <p className="text-sm text-muted-foreground">A receber</p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
          {formatBrlCurrency(data.financial.currentReceivables.pendingAmountInCents)}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {data.financial.currentReceivables.pendingCount}{' '}
          {data.financial.currentReceivables.pendingCount === 1 ? 'cobrança pendente' : 'cobranças pendentes'}
        </p>
      </div>

      <div className="border-t border-border py-5 md:border-t-0 md:border-l md:pl-6">
        <p className="text-sm text-muted-foreground">Serviços em andamento</p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">{data.summary.workOrders.inProgress}</p>

        <p className="mt-1 text-sm text-muted-foreground">
          {data.summary.workOrders.scheduled}{' '}
          {data.summary.workOrders.scheduled === 1 ? 'serviço agendado' : 'serviços agendados'}
        </p>
      </div>
    </section>
  );
}
