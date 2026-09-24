'use client';

import {
  ArrowLeft,
  CalendarClock,
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  MapPin,
  Pencil,
  Play,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listOrganizationMembers } from '@/modules/organizations/services/organization.service';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { WorkOrderReceivableAction } from '@/modules/receivables/components/workOrderReceivableAction';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate, formatDateTime } from '@/shared/formatters/date.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import { canCancelWorkOrder, isWorkOrderPlanningEditable } from '../constants/workOrder.constants';
import { getWorkOrderConfirmationContent, type WorkOrderConfirmation } from '../helpers/workOrderConfirmation.helper';
import { completeWorkOrder, getWorkOrder, startWorkOrder } from '../services/workOrder.service';
import type { WorkOrder } from '../types/workOrder.types';
import { WorkOrderAssignPanel } from './workOrderAssignPanel';
import { WorkOrderCancelDialog } from './workOrderCancelDialog';
import { WorkOrderExecutionNotes } from './workOrderExecutionNotes';
import { WorkOrderPlanningPanel } from './workOrderPlanningPanel';
import { WorkOrderScheduleHistory } from './workOrderScheduleHistory';
import { WorkOrderSchedulePanel } from './workOrderSchedulePanel';
import { WorkOrderStatusBadge } from './workOrderStatusBadge';
import { WorkOrderStatusHistory } from './workOrderStatusHistory';

interface WorkOrderDetailsContentProps {
  workOrderId: string;
}

interface WorkOrderDetailsState {
  workOrder: WorkOrder;
  members: OrganizationMember[];
}

export function WorkOrderDetailsContent({ workOrderId }: WorkOrderDetailsContentProps) {
  const { activeOrganization } = useApp();

  return (
    <OrganizationWorkOrderDetails
      key={`${activeOrganization.id}:${workOrderId}`}
      organizationId={activeOrganization.id}
      workOrderId={workOrderId}
    />
  );
}

function OrganizationWorkOrderDetails({
  organizationId,
  workOrderId,
}: {
  organizationId: string;
  workOrderId: string;
}) {
  const router = useRouter();

  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<WorkOrderDetailsState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [planningOpen, setPlanningOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const [confirmation, setConfirmation] = useState<WorkOrderConfirmation | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    let active = true;

    void Promise.all([getWorkOrder(organizationId, workOrderId), listOrganizationMembers(organizationId)])
      .then(([workOrder, members]) => {
        if (!active) {
          return;
        }

        setLoadError(null);

        setState({
          workOrder,
          members,
        });
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setLoadError(cause instanceof Error ? cause.message : 'Não foi possível carregar a ordem de serviço.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function applyWorkOrder(workOrder: WorkOrder): void {
    setState((current) =>
      current === null
        ? current
        : {
            ...current,
            workOrder,
          },
    );

    setActionError(null);
  }

  async function executeConfirmation(): Promise<void> {
    if (!state || !confirmation || operationLoading) {
      return;
    }

    setOperationLoading(true);
    setActionError(null);

    try {
      const updated =
        confirmation.kind === 'START'
          ? await startWorkOrder(organizationId, state.workOrder.id, state.workOrder.version)
          : await completeWorkOrder(organizationId, state.workOrder.id, state.workOrder.version);

      applyWorkOrder(updated);
      setConfirmation(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.');
    } finally {
      setOperationLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para ordens de serviço
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-destructive">{loadError}</p>

          <Button
            type="button"
            variant="outline"
            onClick={() => setRefreshVersion((value) => value + 1)}
            className="mt-5 cursor-pointer"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!state) {
    return <DetailContentSkeleton label="Carregando ordem de serviço" />;
  }

  const { workOrder, members } = state;

  const assignedMember = members.find((member) => member.userId === workOrder.assignedToId);

  const planningEditable = isWorkOrderPlanningEditable(workOrder.status);
  const ready = workOrder.assignedToId !== null && workOrder.serviceAddress !== null;
  const canStart = planningEditable && ready;
  const canProgress = workOrder.status === 'IN_PROGRESS';
  const canComplete = workOrder.status === 'COMPLETED';

  const confirmationContent = getWorkOrderConfirmationContent(confirmation);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/work-orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Voltar para ordens de serviço
      </Link>

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
              <Button type="button" variant="outline" onClick={() => setPlanningOpen(true)} className="cursor-pointer">
                <Pencil aria-hidden="true" className="size-4" />
                Planejamento
              </Button>

              <Button type="button" variant="outline" onClick={() => setAssignOpen(true)} className="cursor-pointer">
                <Users aria-hidden="true" className="size-4" />
                Responsável
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!ready}
                title={!ready ? 'Informe endereço e responsável antes de agendar.' : undefined}
                onClick={() => setScheduleOpen(true)}
                className="cursor-pointer"
              >
                <CalendarClock aria-hidden="true" className="size-4" />
                {workOrder.status === 'SCHEDULED' ? 'Reagendar' : 'Agendar'}
              </Button>
            </>
          )}

          {canComplete && (
            <WorkOrderReceivableAction
              organizationId={organizationId}
              workOrderId={workOrder.id}
              title={workOrder.title}
            />
          )}

          {canStart && (
            <Button type="button" onClick={() => setConfirmation({ kind: 'START' })} className="cursor-pointer">
              <Play aria-hidden="true" className="size-4" />
              Iniciar serviço
            </Button>
          )}

          {canProgress && (
            <Button type="button" onClick={() => setConfirmation({ kind: 'COMPLETE' })} className="cursor-pointer">
              <Check aria-hidden="true" className="size-4" />
              Concluir serviço
            </Button>
          )}

          {canCancelWorkOrder(workOrder.status) && (
            <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)} className="cursor-pointer">
              <X aria-hidden="true" className="size-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {planningEditable && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {ready ? (
              <CircleCheck aria-hidden="true" className="size-5 text-success" />
            ) : (
              <CircleAlert aria-hidden="true" className="size-5 text-warning" />
            )}

            <div>
              <h2 className="font-heading font-semibold">
                {ready ? 'Pronta para execução' : 'Complete o planejamento'}
              </h2>

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
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="font-heading text-lg font-semibold">Serviços</h2>

            <p className="mt-1 text-sm text-muted-foreground">Itens originados do orçamento aprovado.</p>
          </div>

          <div className="divide-y divide-border">
            {[...workOrder.items]
              .sort((left, right) => left.position - right.position)
              .map((item) => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.name}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                        {' · '}
                        {formatBrlCurrency(item.unitAmountInCents)} por unidade
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      )}
                    </div>

                    <p className="shrink-0 font-semibold">{formatBrlCurrency(item.totalInCents)}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Planejamento</h2>

            <div className="mt-5 space-y-5">
              <div className="flex items-start gap-3">
                <UserRound aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>

                  <p className="mt-1 text-sm font-medium">{assignedMember?.user.name ?? 'Ainda não definido'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">Endereço</p>

                  <p className="mt-1 text-sm font-medium whitespace-pre-wrap">
                    {workOrder.serviceAddress ?? 'Ainda não definido'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarClock aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">Agendamento</p>

                  <p className="mt-1 text-sm font-medium">
                    {workOrder.scheduledStartAt
                      ? `${formatDateTime(workOrder.scheduledStartAt)} → ${formatDateTime(workOrder.scheduledEndAt)}`
                      : 'Ainda não agendado'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Cliente</h2>

            <Link
              href={`/customers/${workOrder.customerId}`}
              className="mt-4 block font-medium hover:text-primary hover:underline"
            >
              {workOrder.customerName}
            </Link>

            {workOrder.customerEmail && <p className="mt-2 text-sm text-muted-foreground">{workOrder.customerEmail}</p>}

            {workOrder.customerPhone && <p className="mt-1 text-sm text-muted-foreground">{workOrder.customerPhone}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold">Resumo financeiro</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBrlCurrency(workOrder.subtotalInCents)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Desconto</span>
                <span>- {formatBrlCurrency(workOrder.discountInCents)}</span>
              </div>

              <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatBrlCurrency(workOrder.totalInCents)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardList aria-hidden="true" className="size-5 text-primary" />

              <h2 className="font-heading text-lg font-semibold">Instruções</h2>
            </div>

            <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {workOrder.instructions ?? 'Nenhuma instrução cadastrada.'}
            </p>
          </section>
        </div>
      </div>

      <div className="mt-5">
        <WorkOrderExecutionNotes key={workOrder.version} workOrder={workOrder} onSaved={applyWorkOrder} />
      </div>

      {workOrder.cancellationReason && (
        <section className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="font-heading text-lg font-semibold text-destructive">Motivo do cancelamento</h2>

          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{workOrder.cancellationReason}</p>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <WorkOrderStatusHistory
          organizationId={organizationId}
          workOrderId={workOrder.id}
          version={workOrder.version}
        />

        <WorkOrderScheduleHistory
          organizationId={organizationId}
          workOrderId={workOrder.id}
          version={workOrder.version}
          members={members}
        />
      </div>

      {planningOpen && (
        <WorkOrderPlanningPanel workOrder={workOrder} onClose={() => setPlanningOpen(false)} onSaved={applyWorkOrder} />
      )}

      {assignOpen && (
        <WorkOrderAssignPanel
          workOrder={workOrder}
          members={members}
          onClose={() => setAssignOpen(false)}
          onSaved={applyWorkOrder}
        />
      )}

      {scheduleOpen && (
        <WorkOrderSchedulePanel workOrder={workOrder} onClose={() => setScheduleOpen(false)} onSaved={applyWorkOrder} />
      )}

      {cancelOpen && (
        <WorkOrderCancelDialog workOrder={workOrder} onClose={() => setCancelOpen(false)} onCanceled={applyWorkOrder} />
      )}

      {confirmation && confirmationContent && (
        <ConfirmationDialog
          title={confirmationContent.title}
          description={confirmationContent.description}
          confirmLabel={confirmationContent.confirmLabel}
          loading={operationLoading}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void executeConfirmation()}
        />
      )}
    </div>
  );
}
