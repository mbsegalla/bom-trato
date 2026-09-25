import { CalendarCheck, CalendarClock, CircleAlert, Play } from 'lucide-react';

import type { ScheduleData } from '../../../types/schedule.types';

export function ScheduleSummary({ data }: { data: ScheduleData }) {
  const scheduledCount = data.items.filter((item) => item.status === 'SCHEDULED').length;
  const inProgressCount = data.items.filter((item) => item.status === 'IN_PROGRESS').length;
  const lateCount = data.items.filter((item) => item.late).length;

  const items = [
    { label: 'No período', value: data.items.length, icon: CalendarCheck, className: 'bg-brand-muted text-primary' },
    { label: 'Agendados', value: scheduledCount, icon: CalendarClock, className: 'bg-brand-muted text-primary' },
    { label: 'Em andamento', value: inProgressCount, icon: Play, className: 'bg-success-surface text-success' },
    { label: 'Atrasados', value: lateCount, icon: CircleAlert, className: 'bg-warning-surface text-warning' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-xl ${item.className}`}>
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold">{item.value}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
