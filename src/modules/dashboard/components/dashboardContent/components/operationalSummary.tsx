import { Banknote, FileText } from 'lucide-react';

import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatTime } from '@/shared/formatters/date.formatter';

interface OperationalSummaryProps {
  data: DashboardData;
}

export function OperationalSummary({ data }: OperationalSummaryProps) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <FileText aria-hidden="true" className="size-5 text-primary" />
        <h2 className="font-heading text-lg font-semibold">Resumo operacional</h2>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Orçamentos em rascunho</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.quotes.draft}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Aguardando resposta</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.quotes.awaitingApproval}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Ordens abertas</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.workOrders.open}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Valor em atraso</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatBrlCurrency(data.financial.currentReceivables.overdueAmountInCents)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Banknote aria-hidden="true" className="size-3.5" />
        Atualizado às {formatTime(data.summary.generatedAt)}
      </div>
    </section>
  );
}
