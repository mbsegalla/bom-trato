'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listOrganizationMembers } from '@/modules/organizations/services/organization.service';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';

import { listWorkOrders } from '../../services/workOrder.service';
import type { WorkOrderListStatus, WorkOrderPage } from '../../types/workOrder.types';
import { WorkOrdersEmptyState } from './components/workOrdersEmptyState';
import { WorkOrdersFilters } from './components/workOrdersFilters';
import { WorkOrdersHeader } from './components/workOrdersHeader';
import { WorkOrdersTable } from './components/workOrdersTable';

interface WorkOrderListState {
  requestKey: string;
  data: WorkOrderPage;
  members: OrganizationMember[];
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

    void Promise.all([listWorkOrders(organizationId, { page, status }), listOrganizationMembers(organizationId)])
      .then(([result, members]) => {
        if (!active) return;

        setError(null);
        setState({ requestKey, data: result, members });
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

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <WorkOrdersFilters status={status} onStatusChange={changeStatus} />

        {error ? (
          <div className="p-8 text-center">
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
          <WorkOrdersTable data={current.data} members={current.members} page={page} onPageChange={setPage} />
        )}
      </section>
    </div>
  );
}
