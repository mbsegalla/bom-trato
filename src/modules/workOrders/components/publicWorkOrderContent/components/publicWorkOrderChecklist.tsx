import { CheckCircle2, Circle, ListChecks } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import type { PublicWorkOrderChecklist as PublicWorkOrderChecklistData } from '../../../types/workOrderChecklist.types';
import { WorkOrderChecklistProgress } from '../../workOrderChecklistProgress';

interface PublicWorkOrderChecklistProps {
  checklist: PublicWorkOrderChecklistData;
}

export function PublicWorkOrderChecklist({ checklist }: PublicWorkOrderChecklistProps) {
  const { items } = checklist;

  if (items.length === 0) {
    return null;
  }

  const completed = items.filter((item) => item.completed).length;

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ListChecks aria-hidden="true" className="size-5" />
        </div>

        <h2 className="font-heading text-xl font-semibold">Etapas do seu atendimento</h2>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Acompanhe as etapas compartilhadas e atualizadas pelo profissional.
      </p>

      <WorkOrderChecklistProgress
        total={items.length}
        completed={completed}
        label="Progresso das etapas compartilhadas do atendimento"
      />

      <ul className="mt-5 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
            {item.completed ? (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            ) : (
              <Circle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed font-medium wrap-break-word">{item.title}</p>

              <p className={cn('mt-1 text-xs', item.completed ? 'text-success' : 'text-muted-foreground')}>
                {item.completed && item.completedAt
                  ? `Concluído em ${formatDateTime(item.completedAt)}`
                  : item.completed
                    ? 'Concluído'
                    : 'Pendente'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
