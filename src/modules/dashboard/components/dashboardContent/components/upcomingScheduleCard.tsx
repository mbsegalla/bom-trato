import { ArrowRight, CalendarDays, CircleCheck } from 'lucide-react';
import Link from 'next/link';

import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';
import { formatShortDate, formatTime } from '@/shared/formatters/date.formatter';

interface UpcomingScheduleCardProps {
  items: DashboardData['upcoming']['items'];
}

export function UpcomingScheduleCard({ items }: UpcomingScheduleCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Próximos agendamentos</h2>
        </div>
        <Link href="/schedule" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Ver todos
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <CircleCheck aria-hidden="true" className="mx-auto size-8 text-success" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum serviço agendado para os próximos passos.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((workOrder) => (
            <div key={workOrder.id} className="grid gap-3 py-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">{formatTime(workOrder.scheduledStartAt)}</p>
                <p className="text-xs text-muted-foreground">{formatShortDate(workOrder.scheduledStartAt)}</p>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{workOrder.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {workOrder.customerName}
                  {workOrder.assignedTo ? ` · ${workOrder.assignedTo.name}` : ''}
                </p>
              </div>
              <ArrowRight aria-hidden="true" className="hidden size-4 text-muted-foreground sm:block" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
