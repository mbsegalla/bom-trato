import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  addMonths,
  buildCalendarDays,
  formatMonthYear,
  isCalendarDayDisabled,
  isSameDay,
  isSameMonth,
} from '../helpers/datePicker.helper';

interface CalendarMonthProps {
  month: Date;
  selected: Date | null;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  onMonthChange(month: Date): void;
  onSelect(date: Date): void;
}

const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CalendarMonth({ month, selected, min, max, disabled, onMonthChange, onSelect }: CalendarMonthProps) {
  const days = buildCalendarDays(month);

  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{formatMonthYear(month)}</p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            aria-label="Mês anterior"
            onClick={() => onMonthChange(addMonths(month, -1))}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          <button
            type="button"
            disabled={disabled}
            aria-label="Próximo mês"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7">
        {weekdays.map((weekday, index) => (
          <div
            key={`${weekday}-${index}`}
            className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((date) => {
          const outside = !isSameMonth(date, month);

          const selectedDate = selected ? isSameDay(date, selected) : false;

          const currentDay = isSameDay(date, today);

          const dateDisabled = disabled || isCalendarDayDisabled(date, min, max);

          return (
            <button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              type="button"
              disabled={dateDisabled}
              aria-label={date.toLocaleDateString('pt-BR')}
              aria-current={currentDay ? 'date' : undefined}
              aria-pressed={selectedDate}
              onClick={() => onSelect(date)}
              className={cn(
                'relative mx-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors outline-none',
                'hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                outside && 'text-muted-foreground/50',
                currentDay && !selectedDate && 'font-semibold text-primary',
                selectedDate && 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90',
                dateDisabled && 'pointer-events-none opacity-30',
              )}
            >
              {date.getDate()}

              {currentDay && !selectedDate && <span className="absolute bottom-1 size-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
