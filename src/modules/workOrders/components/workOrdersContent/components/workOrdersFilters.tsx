import { TabButton } from '@/components/ui/tabButton';

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
        <TabButton
          key={option.value}
          type="button"
          size="sm"
          active={status === option.value}
          aria-pressed={status === option.value}
          onClick={() => onStatusChange(option.value)}
        >
          {option.label}
        </TabButton>
      ))}
    </div>
  );
}
