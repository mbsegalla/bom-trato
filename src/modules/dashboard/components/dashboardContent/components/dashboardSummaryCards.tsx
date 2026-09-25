import { Clock3, WalletCards, Wrench } from 'lucide-react';

import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface DashboardSummaryCardsProps {
  data: DashboardData;
}

export function DashboardSummaryCards({ data }: DashboardSummaryCardsProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-success-surface text-success">
            <WalletCards aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recebido no mês</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
              {formatBrlCurrency(data.financial.periodReceipts.amountInCents)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.financial.periodReceipts.count}{' '}
              {data.financial.periodReceipts.count === 1 ? 'pagamento registrado' : 'pagamentos registrados'}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-warning-surface text-warning">
            <Clock3 aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">A receber</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
              {formatBrlCurrency(data.financial.currentReceivables.pendingAmountInCents)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.financial.currentReceivables.pendingCount}{' '}
              {data.financial.currentReceivables.pendingCount === 1 ? 'cobrança pendente' : 'cobranças pendentes'}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-primary">
            <Wrench aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Serviços em andamento</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
              {data.summary.workOrders.inProgress}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.summary.workOrders.scheduled} agendados para os próximos passos
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
