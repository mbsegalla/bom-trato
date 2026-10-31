'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';

import { listWorkOrders } from '../../services/workOrder.service';
import type { WorkOrderListStatus, WorkOrderPage } from '../../types/workOrder.types';
import { WorkOrdersEmptyState } from './components/workOrdersEmptyState';
import { WorkOrdersFilters } from './components/workOrdersFilters';
import { WorkOrdersHeader } from './components/workOrdersHeader';
import { WorkOrdersTable } from './components/workOrdersTable';

interface WorkOrderListState {
  requestKey: string;
  data: WorkOrderPage;
}

export function WorkOrdersContent() {
  const { activeOrganization } = useApp();

  return <OrganizationWorkOrdersContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationWorkOrdersContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<WorkOrderListStatus>('ALL');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<WorkOrderListState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${page}:${status}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void listWorkOrders(organizationId, { page, status })
      .then((result) => {
        if (!active) return;

        setError(null);
        setState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as ordens de serviço.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, refreshVersion, requestKey, router, status]);

  const current = state?.requestKey === requestKey ? state : null;

  function changeStatus(nextStatus: WorkOrderListStatus): void {
    setPage(1);
    setStatus(nextStatus);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <WorkOrdersHeader />

      <section className="mt-8">
        <WorkOrdersFilters status={status} onStatusChange={changeStatus} />

        {error ? (
          <div className="border-b border-border py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>

            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-5 cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !current ? (
          <ListContentSkeleton columns={6} rows={6} label="Carregando ordens de serviço" />
        ) : current.data.items.length === 0 ? (
          <WorkOrdersEmptyState />
        ) : (
          <WorkOrdersTable data={current.data} page={page} onPageChange={setPage} />
        )}
      </section>
    </div>
  );
}
