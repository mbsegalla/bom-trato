import { History } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { publicWorkOrderTimelineContent } from '../../../constants/workOrderPortal.constants';
import type { PublicWorkOrderTimelineEvent } from '../../../types/workOrderPortal.types';

interface PublicWorkOrderTimelineProps {
  timeline: PublicWorkOrderTimelineEvent[];
}

export function PublicWorkOrderTimeline({ timeline }: PublicWorkOrderTimelineProps) {
  const events = [...timeline].reverse();

  return (
    <section
      aria-labelledby="public-work-order-timeline-title"
      className="rounded-3xl border border-border bg-card p-6 text-card-foreground sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="public-work-order-timeline-title" className="font-heading text-xl font-semibold tracking-tight">
            Histórico do atendimento
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Acompanhe as atualizações registradas pelo profissional.
          </p>
        </div>

        <History aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
      </div>

      {events.length === 0 && (
        <p className="mt-6 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          Nenhuma atualização disponível até o momento.
        </p>
      )}

      <ol className="mt-8">
        {events.map((event, index) => (
          <PublicWorkOrderTimelineItem
            key={`${event.type}:${event.occurredAt.toISOString()}:${index}`}
            event={event}
            latest={index === 0}
            last={index === events.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

interface PublicWorkOrderTimelineItemProps {
  event: PublicWorkOrderTimelineEvent;
  latest: boolean;
  last: boolean;
}

function PublicWorkOrderTimelineItem({ event, latest, last }: PublicWorkOrderTimelineItemProps) {
  const content = publicWorkOrderTimelineContent[event.type];

  const Icon = content.icon;

  const canceled = event.type === 'WORK_ORDER_CANCELED';

  return (
    <li className={cn('relative flex gap-4', !last && 'pb-8')}>
      {!last && <div aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-px bg-border" />}

      <div
        className={cn(
          'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full',
          latest ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
          canceled && 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </div>

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{content.title}</h3>

          {latest && (
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Mais recente</span>
          )}
        </div>

        <time dateTime={event.occurredAt.toISOString()} className="mt-1 block text-xs text-muted-foreground">
          {formatDateTime(event.occurredAt)}
        </time>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.description}</p>

        {event.scheduledStartAt && (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Agendamento registrado nesta atualização</p>

            <p className="mt-1 text-sm font-medium">{formatDateTime(event.scheduledStartAt)}</p>

            {event.scheduledEndAt && (
              <p className="mt-1 text-xs text-muted-foreground">Até {formatDateTime(event.scheduledEndAt)}</p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
