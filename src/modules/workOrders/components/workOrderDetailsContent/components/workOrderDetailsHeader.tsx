import { CalendarClock, Check, LoaderCircle, Pencil, Play, Star, Users, X } from 'lucide-react';

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
  sendingReview: boolean;
  onOpenPlanning: () => void;
  onOpenAssign: () => void;
  onOpenSchedule: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onSendReview: () => void;
}

export function WorkOrderDetailsHeader({
  organizationId,
  workOrder,
  planningEditable,
  ready,
  sendingReview,
  onOpenPlanning,
  onOpenAssign,
  onOpenSchedule,
  onStart,
  onComplete,
  onCancel,
  onSendReview,
}: WorkOrderDetailsHeaderProps) {
  const canStart = planningEditable && ready;
  const canProgress = workOrder.status === 'IN_PROGRESS';
  const completed = workOrder.status === 'COMPLETED';
  const canCancel = canCancelWorkOrder(workOrder.status);

  return (
    <header className="mt-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{workOrder.title}</h1>
            <WorkOrderStatusBadge status={workOrder.status} />
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {workOrder.customerName} · criada em {formatDate(workOrder.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {completed && (
            <WorkOrderReceivableAction
              organizationId={organizationId}
              workOrderId={workOrder.id}
              title={workOrder.title}
            />
          )}

          {completed && (
            <Button type="button" disabled={sendingReview} onClick={onSendReview} className="cursor-pointer">
              {sendingReview ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Star aria-hidden="true" className="size-4" />
              )}

              {sendingReview ? 'Preparando...' : 'Enviar avaliação'}
            </Button>
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
        </div>
      </div>

      {(planningEditable || canCancel) && (
        <div className="mt-5 flex flex-wrap items-center gap-1 border-y border-border py-2">
          {planningEditable && (
            <>
              <Button type="button" variant="ghost" onClick={onOpenPlanning} className="cursor-pointer">
                <Pencil aria-hidden="true" className="size-4" />
                Planejamento
              </Button>

              <Button type="button" variant="ghost" onClick={onOpenAssign} className="cursor-pointer">
                <Users aria-hidden="true" className="size-4" />
                Responsável
              </Button>

              <Button
                type="button"
                variant="ghost"
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

          {canCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="ml-auto cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X aria-hidden="true" className="size-4" />
              Cancelar
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
