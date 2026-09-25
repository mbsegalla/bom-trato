import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
        {receivableStatusOptions.map((option) => (
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
      <select
        value={overdue}
        onChange={(event) => onOverdueChange(event.target.value as OverdueFilter)}
        className="h-10 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="ALL">Todas as situações</option>
        <option value="OVERDUE">Somente atrasados</option>
        <option value="ON_TIME">Sem atraso</option>
      </select>
    </div>
  );
}
