import { cn } from '@/lib/utils';

import { getWorkOrderStatusLabel } from '../constants/workOrder.constants';
import type { WorkOrderStatus } from '../types/workOrder.types';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
}

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
        status === 'OPEN' && 'bg-muted text-muted-foreground',
        status === 'SCHEDULED' && 'bg-brand-muted text-primary',
        status === 'IN_PROGRESS' && 'bg-warning-surface text-warning',
        status === 'COMPLETED' && 'bg-success-surface text-success',
        status === 'CANCELED' && 'bg-destructive/10 text-destructive',
      )}
    >
      {getWorkOrderStatusLabel(status)}
    </span>
  );
}
