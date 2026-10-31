import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { workOrderStatusOptions } from '../../../constants/workOrder.constants';
import type { WorkOrderListStatus } from '../../../types/workOrder.types';

interface WorkOrdersFiltersProps {
  status: WorkOrderListStatus;
  onStatusChange: (status: WorkOrderListStatus) => void;
}

export function WorkOrdersFilters({ status, onStatusChange }: WorkOrdersFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Status das ordens de serviço"
      className="flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4"
    >
      {workOrderStatusOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={status === option.value}
          onClick={() => onStatusChange(option.value)}
          className={cn(
            'cursor-pointer rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-1 hover:bg-transparent',
            status === option.value && 'border-primary text-primary',
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
