'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import { listWorkOrderRecurrences, saveWorkOrderRecurrence } from '../../services/workOrderRecurrence.service';
import type {
  WorkOrderRecurrenceList,
  WorkOrderRecurrenceListItem,
  WorkOrderRecurrenceListStatus,
  WorkOrderRecurrenceVisitPeriod,
} from '../../types/workOrderRecurrence.types';
import { WorkOrderRecurrencesFilters } from './components/workOrderRecurrencesFilters';
import { WorkOrderRecurrencesTable } from './components/workOrderRecurrencesTable';

type RecurrencesState =
  | { requestKey: string; kind: 'ready'; data: WorkOrderRecurrenceList }
  | { requestKey: string; kind: 'error'; message: string };

export function WorkOrderRecurrencesContent() {
  const { activeOrganization } = useApp();

  return <OrganizationRecurrencesContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationRecurrencesContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const [pendingWorkOrderId, setPendingWorkOrderId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WorkOrderRecurrenceListStatus>('ALL');
  const [visit, setVisit] = useState<WorkOrderRecurrenceVisitPeriod>('ALL');
  const [customerName, setCustomerName] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<RecurrencesState | null>(null);

  const requestKey = JSON.stringify([organizationId, page, status, visit, customerName, refreshVersion]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void listWorkOrderRecurrences(organizationId, { page, status, visit, customerName })
      .then((data) => {
        if (active) {
          setState({ requestKey, kind: 'ready', data });
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setState({
          requestKey,
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar os serviços recorrentes.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, status, visit, customerName, refreshVersion, requestKey, router]);

  const current = state?.requestKey === requestKey ? state : null;

  function refresh(): void {
    setRefreshVersion((value) => value + 1);
  }

  async function toggleRecurrence(item: WorkOrderRecurrenceListItem): Promise<void> {
    if (current?.kind !== 'ready' || !current.data.canConfigure || submittingRef.current) {
      return;
    }

    const { version, intervalUnit, intervalCount, nextVisitOn, enabled } = item.recurrence;

    if (!enabled && (item.customerArchived || nextVisitOn < current.data.today)) {
      return;
    }

    submittingRef.current = true;
    setPendingWorkOrderId(item.workOrderId);

    try {
      const result = await saveWorkOrderRecurrence(organizationId, item.workOrderId, version, {
        intervalUnit,
        intervalCount,
        nextVisitOn,
        enabled: !enabled,
      });

      if (!mountedRef.current) {
        return;
      }

      if (result.recurrence?.version !== version + 1 || result.recurrence.enabled !== !enabled) {
        throw new Error('Não foi possível confirmar a alteração da recorrência.');
      }

      toast.success(enabled ? 'Recorrência pausada.' : 'Recorrência reativada.');
    } catch (cause: unknown) {
      if (!mountedRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');
        return;
      }

      toast.error(cause instanceof Error ? cause.message : 'Não foi possível alterar a recorrência.');
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        setPendingWorkOrderId(null);
        setPage(1);
        refresh();
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Serviços recorrentes</h1>

          <p className="mt-2 text-muted-foreground">
            Acompanhe as próximas visitas previstas e organize os serviços que se repetem.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={current === null || pendingWorkOrderId !== null}
          onClick={refresh}
          className="min-h-11 cursor-pointer"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Atualizar
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        As datas seguem o horário de Brasília. Serviços ativos com geração automática configurada podem criar
        orçamentos em rascunho. Nenhum agendamento, aprovação ou cobrança é realizado automaticamente.
      </p>

      <section className="mt-8">
        <WorkOrderRecurrencesFilters
          status={status}
          visit={visit}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onVisitChange={(value) => {
            setVisit(value);
            setPage(1);
          }}
          onCustomerNameChange={(value) => {
            setCustomerName(value);
            setPage(1);
          }}
          onClear={() => {
            setStatus('ALL');
            setVisit('ALL');
            setCustomerName('');
            setPage(1);
          }}
        />

        {current?.kind === 'error' ? (
          <div className="border-b border-border py-10 text-center">
            <p role="alert" className="text-sm text-destructive">
              {current.message}
            </p>
            <Button type="button" variant="outline" onClick={refresh} className="mt-5 cursor-pointer">
              Tentar novamente
            </Button>
          </div>
        ) : current?.kind === 'ready' ? (
          <>
            {!current.data.canConfigure && (
              <p className="border-b border-border py-4 text-sm text-muted-foreground">
                As recorrências estão disponíveis apenas para consulta.
              </p>
            )}

            <WorkOrderRecurrencesTable
              data={current.data}
              pendingWorkOrderId={pendingWorkOrderId}
              onToggle={(item) => void toggleRecurrence(item)}
              onPageChange={setPage}
            />
          </>
        ) : (
          <ListContentSkeleton columns={6} rows={6} label="Carregando serviços recorrentes" />
        )}
      </section>
    </div>
  );
}
