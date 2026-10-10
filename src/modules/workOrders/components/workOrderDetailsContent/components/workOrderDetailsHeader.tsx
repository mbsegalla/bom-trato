import { CalendarClock, Check, Pencil, Play, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { WorkOrderReceivableAction } from '@/modules/receivables/components/workOrderReceivableAction';
import { formatDate } from '@/shared/formatters/date.formatter';

import { canCancelWorkOrder } from '../../../constants/workOrder.constants';
import type { WorkOrder } from '../../../types/workOrder.types';
import { WorkOrderStatusBadge } from '../../workOrderStatusBadge';

interface WorkOrderDetailsHeaderProps {
  organizationId: string;
  workOrder: WorkOrder;
  planningEditable: boolean;
  ready: boolean;
  canStart: boolean;
  canProgress: boolean;
  canCreateReceivable: boolean;
  onOpenPlanning: () => void;
  onOpenAssign: () => void;
  onOpenSchedule: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export function WorkOrderDetailsHeader({
  organizationId,
  workOrder,
  planningEditable,
  ready,
  canStart,
  canProgress,
  canCreateReceivable,
  onOpenPlanning,
  onOpenAssign,
  onOpenSchedule,
  onStart,
  onComplete,
  onCancel,
}: WorkOrderDetailsHeaderProps) {
  return (
    <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{workOrder.title}</h1>
          <WorkOrderStatusBadge status={workOrder.status} />
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {workOrder.customerName} · criada em {formatDate(workOrder.createdAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {planningEditable && (
          <>
            <Button type="button" variant="outline" onClick={onOpenPlanning} className="cursor-pointer">
              <Pencil aria-hidden="true" className="size-4" />
              Planejamento
            </Button>

            <Button type="button" variant="outline" onClick={onOpenAssign} className="cursor-pointer">
              <Users aria-hidden="true" className="size-4" />
              Responsável
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!ready}
              title={!ready ? 'Informe endereço e responsável antes de agendar.' : undefined}
              onClick={onOpenSchedule}
              className="cursor-pointer"
            >
              <CalendarClock aria-hidden="true" className="size-4" />
              {workOrder.status === 'SCHEDULED' ? 'Reagendar' : 'Agendar'}
            </Button>
          </>
        )}

        {canCreateReceivable && (
          <WorkOrderReceivableAction
            organizationId={organizationId}
            workOrderId={workOrder.id}
            title={workOrder.title}
          />
        )}

        {canStart && (
          <Button type="button" onClick={onStart} className="cursor-pointer">
            <Play aria-hidden="true" className="size-4" />
            Iniciar serviço
          </Button>
        )}

        {canProgress && (
          <Button type="button" onClick={onComplete} className="cursor-pointer">
            <Check aria-hidden="true" className="size-4" />
            Concluir serviço
          </Button>
        )}

        {canCancelWorkOrder(workOrder.status) && (
          <Button type="button" variant="destructive" onClick={onCancel} className="cursor-pointer">
            <X aria-hidden="true" className="size-4" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
