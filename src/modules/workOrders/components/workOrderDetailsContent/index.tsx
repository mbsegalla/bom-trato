'use client';

import { ArrowLeft } from 'lucide-react';
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

import { isWorkOrderPlanningEditable } from '../../constants/workOrder.constants';
import {
  getWorkOrderConfirmationContent,
  type WorkOrderConfirmation,
} from '../../helpers/workOrderConfirmation.helper';
import {
  createWorkOrderReviewUrl,
  createWorkOrderReviewWhatsAppMessage,
  createWorkOrderReviewWhatsAppUrl,
} from '../../helpers/workOrderReviewWhatsapp.helper';
import {
  completeWorkOrder,
  getWorkOrder,
  sendWorkOrderReviewInvitation,
  startWorkOrder,
} from '../../services/workOrder.service';
import type { WorkOrder } from '../../types/workOrder.types';
import { WorkOrderAssignPanel } from '../workOrderAssignPanel';
import { WorkOrderCancelDialog } from '../workOrderCancelDialog';
import { WorkOrderExecutionNotes } from '../workOrderExecutionNotes';
import { WorkOrderPlanningPanel } from '../workOrderPlanningPanel';
import { WorkOrderScheduleHistory } from '../workOrderScheduleHistory';
import { WorkOrderSchedulePanel } from '../workOrderSchedulePanel';
import { WorkOrderStatusHistory } from '../workOrderStatusHistory';
import { WorkOrderCancellationNotice } from './components/workOrderCancellationNotice';
import { WorkOrderDetailsHeader } from './components/workOrderDetailsHeader';
import { WorkOrderItemsSection } from './components/workOrderItemsSection';
import { WorkOrderOverviewSidebar } from './components/workOrderOverviewSidebar';
import { WorkOrderReadinessNotice } from './components/workOrderReadinessNotice';

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
  const [sendingReview, setSendingReview] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([getWorkOrder(organizationId, workOrderId), listOrganizationMembers(organizationId)])
      .then(([workOrder, members]) => {
        if (!active) return;

        setLoadError(null);
        setState({ workOrder, members });
      })
      .catch((cause: unknown) => {
        if (!active) return;

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
    setState((current) => (current === null ? current : { ...current, workOrder }));
    setActionError(null);
    setActionMessage(null);
  }

  async function handleSendReview(): Promise<void> {
    if (!state || sendingReview) {
      return;
    }

    const { workOrder } = state;

    const whatsappWindow = workOrder.customerEmail === null ? window.open('about:blank', '_blank') : null;

    if (whatsappWindow !== null) {
      whatsappWindow.opener = null;
    }

    setSendingReview(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const delivery = await sendWorkOrderReviewInvitation(organizationId, workOrder.id);

      if (delivery.channel === 'EMAIL') {
        whatsappWindow?.close();

        setActionMessage(`Avaliação enviada por e-mail para ${delivery.recipient}.`);

        return;
      }

      const reviewUrl = createWorkOrderReviewUrl(delivery.token);

      const message = createWorkOrderReviewWhatsAppMessage(workOrder, delivery.organizationName, reviewUrl);

      const whatsappUrl = createWorkOrderReviewWhatsAppUrl(delivery.recipient, message);

      if (whatsappWindow !== null) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.assign(whatsappUrl);
      }

      setActionMessage('Mensagem de avaliação preparada no WhatsApp.');
    } catch (cause: unknown) {
      whatsappWindow?.close();

      setActionError(cause instanceof Error ? cause.message : 'Não foi possível preparar a avaliação.');
    } finally {
      setSendingReview(false);
    }
  }

  async function executeConfirmation(): Promise<void> {
    if (!state || !confirmation || operationLoading) return;

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

        <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center">
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

  if (!state) return <DetailContentSkeleton label="Carregando ordem de serviço" />;

  const { workOrder, members } = state;
  const assignedMember = members.find((member) => member.userId === workOrder.assignedToId);
  const planningEditable = isWorkOrderPlanningEditable(workOrder.status);
  const ready = workOrder.assignedToId !== null && workOrder.serviceAddress !== null;
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

      <WorkOrderDetailsHeader
        organizationId={organizationId}
        workOrder={workOrder}
        planningEditable={planningEditable}
        ready={ready}
        sendingReview={sendingReview}
        onOpenPlanning={() => setPlanningOpen(true)}
        onOpenAssign={() => setAssignOpen(true)}
        onOpenSchedule={() => setScheduleOpen(true)}
        onStart={() => setConfirmation({ kind: 'START' })}
        onComplete={() => setConfirmation({ kind: 'COMPLETE' })}
        onCancel={() => setCancelOpen(true)}
        onSendReview={() => void handleSendReview()}
      />

      {actionError && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </p>
      )}

      {actionMessage && (
        <p
          role="status"
          className="mt-5 border-l-2 border-success bg-success-surface/60 px-4 py-3 text-sm text-success"
        >
          {actionMessage}
        </p>
      )}

      {planningEditable && <WorkOrderReadinessNotice workOrder={workOrder} ready={ready} />}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkOrderItemsSection workOrder={workOrder} />
        <WorkOrderOverviewSidebar workOrder={workOrder} assignedMember={assignedMember} />
      </div>

      <div className="mt-10">
        <WorkOrderExecutionNotes key={workOrder.version} workOrder={workOrder} onSaved={applyWorkOrder} />
      </div>

      {workOrder.cancellationReason && <WorkOrderCancellationNotice reason={workOrder.cancellationReason} />}

      <div className="mt-10 grid gap-10 border-t border-border pt-8 lg:grid-cols-2">
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
