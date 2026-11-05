import { TabButton } from '@/components/ui/tabButton';
import { receivableStatusOptions } from '@/modules/receivables/constants/receivable.constants';
import type { ReceivableListStatus } from '@/modules/receivables/types/receivable.types';

export type OverdueFilter = 'ALL' | 'OVERDUE' | 'ON_TIME';

interface ReceivablesFiltersProps {
  status: ReceivableListStatus;
  overdue: OverdueFilter;
  onStatusChange: (status: ReceivableListStatus) => void;
  onOverdueChange: (overdue: OverdueFilter) => void;
}

export function ReceivablesFilters({ status, overdue, onStatusChange, onOverdueChange }: ReceivablesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 border-y border-border py-4 xl:flex-row xl:items-center xl:justify-between">
      <div role="group" aria-label="Status dos recebíveis" className="flex flex-wrap gap-x-5 gap-y-2">
        {receivableStatusOptions.map((option) => (
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

      <select
        value={overdue}
        onChange={(event) => onOverdueChange(event.target.value as OverdueFilter)}
        className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="ALL">Todas as situações</option>
        <option value="OVERDUE">Somente atrasados</option>
        <option value="ON_TIME">Sem atraso</option>
      </select>
    </div>
  );
}
