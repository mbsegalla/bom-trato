import { Banknote } from 'lucide-react';

import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatTime } from '@/shared/formatters/date.formatter';

interface OperationalSummaryProps {
  data: DashboardData;
}

export function OperationalSummary({ data }: OperationalSummaryProps) {
  return (
    <section className="mt-8 border-t border-border pt-8">
      <h2 className="font-heading text-xl font-semibold">Resumo operacional</h2>

      <div className="mt-5 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">
        <div className="py-5 sm:pr-5">
          <p className="text-sm text-muted-foreground">Orçamentos em rascunho</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.quotes.draft}</p>
        </div>

        <div className="border-t border-border py-5 sm:border-t-0 sm:border-l sm:pl-5 lg:px-5">
          <p className="text-sm text-muted-foreground">Aguardando resposta</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.quotes.awaitingApproval}</p>
        </div>

        <div className="border-t border-border py-5 lg:border-t-0 lg:border-l lg:px-5">
          <p className="text-sm text-muted-foreground">Ordens abertas</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.workOrders.open}</p>
        </div>

        <div className="border-t border-border py-5 lg:border-t-0 lg:border-l lg:pl-5">
          <p className="text-sm text-muted-foreground">Valor em atraso</p>
          <p className="mt-1 text-2xl font-semibold text-warning">
            {formatBrlCurrency(data.financial.currentReceivables.overdueAmountInCents)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Banknote aria-hidden="true" className="size-3.5" />
        Atualizado às {formatTime(data.summary.generatedAt)}
      </div>
    </section>
  );
}
