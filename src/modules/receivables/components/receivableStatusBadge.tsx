import { cn } from '@/lib/utils';

import { getReceivableStatusLabel } from '../constants/receivable.constants';
import type { ReceivableStatus } from '../types/receivable.types';

interface ReceivableStatusBadgeProps {
  status: ReceivableStatus;
  overdue?: boolean;
}

export function ReceivableStatusBadge({ status, overdue = false }: ReceivableStatusBadgeProps) {
  if (overdue && status !== 'PAID' && status !== 'CANCELED') {
    return (
      <span className="inline-flex rounded-full bg-warning-surface px-3 py-1 text-xs font-medium text-warning">
        Em atraso
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
        status === 'OPEN' && 'bg-brand-muted text-primary',
        status === 'PARTIALLY_PAID' && 'bg-warning-surface text-warning',
        status === 'PAID' && 'bg-success-surface text-success',
        status === 'CANCELED' && 'bg-destructive/10 text-destructive',
      )}
    >
      {getReceivableStatusLabel(status)}
    </span>
  );
}
