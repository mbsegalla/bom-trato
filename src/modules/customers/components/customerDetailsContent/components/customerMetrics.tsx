import type { LucideIcon } from 'lucide-react';
import { BriefcaseBusiness, CircleCheck, FileText, Receipt, WalletCards } from 'lucide-react';

import type { CustomerOverview } from '@/modules/customers/types/customer.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';

interface CustomerMetricsProps {
  summary: CustomerOverview['summary'];
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'brand' | 'success' | 'warning';
  valueClassName?: string;
}

function MetricCard({ label, value, icon: Icon, tone = 'brand', valueClassName = '' }: MetricCardProps) {
  const toneClassName =
    tone === 'success'
      ? 'bg-success-surface text-success'
      : tone === 'warning'
        ? 'bg-warning-surface text-warning'
        : 'bg-brand-muted text-primary';

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${toneClassName}`}>
          <Icon aria-hidden="true" className="size-5" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${valueClassName}`}>{value}</p>
        </div>
      </div>
    </article>
  );
}

export function CustomerMetrics({ summary }: CustomerMetricsProps) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Orçamentos" value={summary.quoteCount} icon={FileText} />
      <MetricCard label="Ordens de serviço" value={summary.workOrderCount} icon={BriefcaseBusiness} />
      <MetricCard
        label="Serviços concluídos"
        value={summary.completedWorkOrderCount}
        icon={CircleCheck}
        tone="success"
      />
      <MetricCard
        label="A receber"
        value={formatBrlCurrency(summary.pendingAmountInCents)}
        icon={Receipt}
        valueClassName="text-primary"
      />
      <MetricCard
        label="Em atraso"
        value={formatBrlCurrency(summary.overdueAmountInCents)}
        icon={WalletCards}
        tone="warning"
      />
      <MetricCard
        label="Recebido"
        value={formatBrlCurrency(summary.receivedAmountInCents)}
        icon={WalletCards}
        tone="success"
        valueClassName="text-success"
      />
    </div>
  );
}
