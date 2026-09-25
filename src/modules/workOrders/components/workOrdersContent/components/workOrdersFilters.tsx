import { Button } from '@/components/ui/button';

import { workOrderStatusOptions } from '../../../constants/workOrder.constants';
import type { WorkOrderListStatus } from '../../../types/workOrder.types';

interface WorkOrdersFiltersProps {
  status: WorkOrderListStatus;
  onStatusChange: (status: WorkOrderListStatus) => void;
}

export function WorkOrdersFilters({ status, onStatusChange }: WorkOrdersFiltersProps) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-5">
      {workOrderStatusOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={status === option.value ? 'default' : 'ghost'}
          onClick={() => onStatusChange(option.value)}
          className="cursor-pointer rounded-lg"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
