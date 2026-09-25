import { Banknote, CalendarDays, Receipt, WalletCards } from 'lucide-react';

import type { Receivable } from '@/modules/receivables/types/receivable.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

export function ReceivableMetrics({ receivable }: { receivable: Receivable }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="mt-1 text-xl font-semibold">{formatBrlCurrency(receivable.amountInCents)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
            <Banknote className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recebido</p>
            <p className="mt-1 text-xl font-semibold text-success">{formatBrlCurrency(receivable.receivedInCents)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <WalletCards className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="mt-1 text-xl font-semibold text-primary">{formatBrlCurrency(receivable.balanceInCents)}</p>
          </div>
        </div>
      </article>
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vencimento</p>
            <p className="mt-1 text-xl font-semibold">{formatDate(receivable.dueAt)}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
