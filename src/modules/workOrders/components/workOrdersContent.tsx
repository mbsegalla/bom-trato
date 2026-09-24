'use client';

import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ListContentSkeleton } from '@/components/skeletons/dataLoadingSkeletons';
import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listOrganizationMembers } from '@/modules/organizations/services/organization.service';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { workOrderStatusOptions } from '../constants/workOrder.constants';
import { listWorkOrders } from '../services/workOrder.service';
import type { WorkOrderListStatus, WorkOrderPage } from '../types/workOrder.types';
import { WorkOrderStatusBadge } from './workOrderStatusBadge';

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

    void Promise.all([
      listWorkOrders(organizationId, {
        page,
        status,
      }),
      listOrganizationMembers(organizationId),
    ])
      .then(([result, members]) => {
        if (!active) {
          return;
        }

        setError(null);

        setState({
          requestKey,
          data: result,
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

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as ordens de serviço.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, refreshVersion, requestKey, router, status]);

  const current = state?.requestKey === requestKey ? state : null;

  function memberName(userId: string | null): string {
    if (userId === null) {
      return 'Sem responsável';
    }

    return current?.members.find((member) => member.userId === userId)?.user.name ?? 'Membro indisponível';
  }

  function changeStatus(nextStatus: WorkOrderListStatus): void {
    setPage(1);
    setStatus(nextStatus);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Ordens de serviço</h1>

        <p className="mt-2 text-muted-foreground">
          Organize o planejamento, a agenda e a execução dos serviços aprovados.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-border p-5">
          {workOrderStatusOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={status === option.value ? 'default' : 'ghost'}
              onClick={() => changeStatus(option.value)}
              className="cursor-pointer rounded-lg"
            >
              {option.label}
            </Button>
          ))}
        </div>

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
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
              <ClipboardList aria-hidden="true" className="size-6" />
            </div>

            <h2 className="mt-5 font-heading text-xl font-semibold">Nenhuma ordem de serviço por aqui</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Uma ordem de serviço pode ser criada a partir de um orçamento aprovado.
            </p>

            <Link
              href="/quotes"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Ver orçamentos
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3">Serviço</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Responsável</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Agendamento</th>
                    <th className="px-6 py-3">Valor</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {current.data.items.map((workOrder) => (
                    <tr key={workOrder.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Link
                          href={`/work-orders/${workOrder.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {workOrder.title}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-sm">{workOrder.customerName}</td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{memberName(workOrder.assignedToId)}</td>

                      <td className="px-6 py-4">
                        <WorkOrderStatusBadge status={workOrder.status} />
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDateTime(workOrder.scheduledStartAt, 'Ainda não agendado')}
                      </td>

                      <td className="px-6 py-4 font-medium">{formatBrlCurrency(workOrder.totalInCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-sm text-muted-foreground">Página {current.data.page}</p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={!current.data.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                  className="cursor-pointer"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
