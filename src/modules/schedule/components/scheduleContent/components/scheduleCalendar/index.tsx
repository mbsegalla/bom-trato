import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDate, formatWeekday } from '@/shared/formatters/date.formatter';

import { dateKey, getCalendarDays, getScheduleItemsForDay } from '../../../../helpers/scheduleCalendar.helper';
import type { ScheduleItem } from '../../../../types/schedule.types';
import { ScheduleEvent } from './components/scheduleEvent';

interface ScheduleCalendarProps {
  month: Date;
  items: ScheduleItem[];
}
const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;

export function ScheduleCalendar({ month, items }: ScheduleCalendarProps) {
  const days = getCalendarDays(month);
  const activeDays = days.filter((day) => day.currentMonth && getScheduleItemsForDay(items, day.date).length > 0);

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {weekdays.map((weekday) => (
            <div key={weekday} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayItems = getScheduleItemsForDay(items, day.date);
            return (
              <div
                key={dateKey(day.date)}
                className={cn(
                  'min-h-40 border-t border-l border-border p-2',
                  index < 7 && 'border-t-0',
                  index % 7 === 0 && 'border-l-0',
                  !day.currentMonth && 'bg-muted/20',
                )}
              >
                <div className="mb-2 flex justify-end">
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-xs',
                      !day.currentMonth && 'text-muted-foreground/50',
                      day.today && 'bg-primary font-semibold text-primary-foreground',
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayItems.map((item) => (
                    <ScheduleEvent key={item.id} item={item} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:hidden">
        {activeDays.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-muted text-primary">
              <CalendarDays aria-hidden="true" className="size-5" />
            </div>
            <p className="mt-4 font-medium">Nenhum serviço agendado neste mês</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Os serviços aparecerão aqui assim que uma ordem for agendada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDays.map((day) => {
              const dayItems = getScheduleItemsForDay(items, day.date);
              return (
                <section key={dateKey(day.date)} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3">
                    <p className="font-heading font-semibold capitalize">{formatWeekday(day.date)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(day.date)}</p>
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <ScheduleEvent key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
