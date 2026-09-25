import { CircleAlert, CircleCheck } from 'lucide-react';

import type { WorkOrder } from '../../../types/workOrder.types';

export function WorkOrderReadinessNotice({ workOrder, ready }: { workOrder: WorkOrder; ready: boolean }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {ready ? (
          <CircleCheck aria-hidden="true" className="size-5 text-success" />
        ) : (
          <CircleAlert aria-hidden="true" className="size-5 text-warning" />
        )}

        <div>
          <h2 className="font-heading font-semibold">{ready ? 'Pronta para execução' : 'Complete o planejamento'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? 'Responsável e endereço estão definidos.'
              : 'Defina os dados abaixo antes de agendar ou iniciar o serviço.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          {workOrder.assignedToId ? (
            <CircleCheck aria-hidden="true" className="size-4 text-success" />
          ) : (
            <CircleAlert aria-hidden="true" className="size-4 text-warning" />
          )}
          Responsável
        </div>

        <div className="flex items-center gap-2 text-sm">
          {workOrder.serviceAddress ? (
            <CircleCheck aria-hidden="true" className="size-4 text-success" />
          ) : (
            <CircleAlert aria-hidden="true" className="size-4 text-warning" />
          )}
          Endereço do serviço
        </div>
      </div>
    </section>
  );
}
