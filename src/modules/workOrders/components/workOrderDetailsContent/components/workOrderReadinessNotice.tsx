import { CircleAlert, CircleCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { WorkOrder } from '../../../types/workOrder.types';

export function WorkOrderReadinessNotice({ workOrder, ready }: { workOrder: WorkOrder; ready: boolean }) {
  return (
    <section
      className={cn(
        'mt-6 border-l-2 px-4 py-3',
        ready ? 'border-success bg-success-surface/60' : 'border-warning bg-warning-surface/60',
      )}
    >
      <div className="flex items-start gap-3">
        {ready ? (
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
        ) : (
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
        )}

        <div>
          <h2 className="font-heading font-semibold">{ready ? 'Pronta para execução' : 'Complete o planejamento'}</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? 'Responsável e endereço estão definidos.'
              : 'Defina os dados abaixo antes de agendar ou iniciar o serviço.'}
          </p>

          {!ready && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                {workOrder.assignedToId ? (
                  <CircleCheck aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <CircleAlert aria-hidden="true" className="size-4 text-warning" />
                )}
                Responsável
              </div>

              <div className="flex items-center gap-2">
                {workOrder.serviceAddress ? (
                  <CircleCheck aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <CircleAlert aria-hidden="true" className="size-4 text-warning" />
                )}
                Endereço do serviço
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
