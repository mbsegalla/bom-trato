import { Clock, MapPin, UserRound } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { formatTime } from '@/shared/formatters/date.formatter';

import type { ScheduleItem } from '../../../../../types/schedule.types';

interface ScheduleEventProps {
  item: ScheduleItem;
  compact?: boolean;
}

export function ScheduleEvent({ item, compact = false }: ScheduleEventProps) {
  return (
    <Link
      href={`/work-orders/${item.id}`}
      title={`${item.title} - ${item.customerName}`}
      className={cn(
        'block rounded-xl border transition-colors',
        compact ? 'p-2' : 'p-4',
        item.late
          ? 'border-warning/30 bg-warning-surface hover:bg-warning-surface/70'
          : item.status === 'IN_PROGRESS'
            ? 'border-success/30 bg-success-surface hover:bg-success-surface/70'
            : 'border-border bg-background hover:bg-muted',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Clock aria-hidden="true" className="size-3.5" />
        <span>
          {formatTime(item.scheduledStartAt)} – {formatTime(item.scheduledEndAt)}
        </span>
        {item.late && <span className="ml-auto text-warning">Atrasado</span>}
      </div>
      <p className={cn('mt-1 font-medium', compact && 'truncate text-xs')}>{item.title}</p>

      {!compact && (
        <>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound aria-hidden="true" className="size-4" />
            <span>{item.customerName}</span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">Responsável: {item.assignedToName ?? 'Não definido'}</p>

          {item.serviceAddress && (
            <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{item.serviceAddress}</span>
            </div>
          )}
        </>
      )}
    </Link>
  );
}
