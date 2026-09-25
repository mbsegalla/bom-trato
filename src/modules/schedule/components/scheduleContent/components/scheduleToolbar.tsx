'use client';

import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatMonthYear } from '@/shared/formatters/date.formatter';

interface ScheduleToolbarProps {
  month: Date;
  loading: boolean;
  onPreviousMonth(): void;
  onNextMonth(): void;
  onToday(): void;
  onRefresh(): void;
}

export function ScheduleToolbar({
  month,
  loading,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onRefresh,
}: ScheduleToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Mês anterior"
          onClick={onPreviousMonth}
          className="cursor-pointer"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próximo mês"
          onClick={onNextMonth}
          className="cursor-pointer"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
        <h2 className="ml-2 font-heading text-xl font-semibold capitalize">{formatMonthYear(month)}</h2>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onToday} className="cursor-pointer">
          Hoje
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={loading}
          aria-label="Atualizar agenda"
          onClick={onRefresh}
          className="cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className={loading ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </div>
    </div>
  );
}
