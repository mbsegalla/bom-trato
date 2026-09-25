import { AlertTriangle, Banknote, Receipt, WalletCards } from 'lucide-react';

import { ReceivableSummarySkeleton } from '@/modules/receivables/components/receivableSkeletons';
import type { ReceivableFinancial } from '@/modules/receivables/types/receivable.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

export function ReceivablesSummary({ financial }: { financial: ReceivableFinancial | null }) {
  if (!financial) return <ReceivableSummarySkeleton />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <WalletCards className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">A receber</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatBrlCurrency(financial.currentReceivables.pendingAmountInCents)}
            </p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-warning-surface text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Em atraso</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatBrlCurrency(financial.currentReceivables.overdueAmountInCents)}
            </p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
            <Banknote className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recebido no mês</p>
            <p className="mt-1 text-2xl font-semibold">{formatBrlCurrency(financial.periodReceipts.amountInCents)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pendências</p>
            <p className="mt-1 text-2xl font-semibold">{financial.currentReceivables.pendingCount}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
