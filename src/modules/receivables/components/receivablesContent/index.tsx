'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { ReceivableListSkeleton } from '@/modules/receivables/components/receivableSkeletons';
import { getReceivableFinancial, listReceivables } from '@/modules/receivables/services/receivable.service';
import type {
  ReceivableFinancial,
  ReceivableListStatus,
  ReceivablePage,
} from '@/modules/receivables/types/receivable.types';

import { type OverdueFilter, ReceivablesFilters } from './components/receivablesFilters';
import { ReceivablesSummary } from './components/receivablesSummary';
import { ReceivablesTable } from './components/receivablesTable';

type ListState = { requestKey: string; data: ReceivablePage };
type ReceivableListErrorState = { requestKey: string; message: string };

export function ReceivablesContent() {
  const { activeOrganization } = useApp();

  return <OrganizationReceivablesContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationReceivablesContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReceivableListStatus>('ALL');
  const [overdue, setOverdue] = useState<OverdueFilter>('ALL');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [listState, setListState] = useState<ListState | null>(null);
  const [financial, setFinancial] = useState<ReceivableFinancial | null>(null);
  const [errorState, setErrorState] = useState<ReceivableListErrorState | null>(null);
  const requestKey = `${organizationId}:${page}:${status}:${overdue}:${refreshVersion}`;

  useEffect(() => {
    let active = true;

    void getReceivableFinancial(organizationId)
      .then((result) => {
        if (active) setFinancial(result);
      })
      .catch((cause: unknown) => {
        if (cause instanceof SessionError && cause.status === 401) router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [organizationId, router]);

  useEffect(() => {
    let active = true;

    void listReceivables(organizationId, {
      page,
      status,
      overdue: overdue === 'ALL' ? undefined : overdue === 'OVERDUE',
    })
      .then((result) => {
        if (!active) return;

        setErrorState(null);
        setListState({ requestKey, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setErrorState({
          requestKey,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar os recebíveis.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, overdue, page, refreshVersion, requestKey, router, status]);

  const data = listState?.data ?? null;
  const error = errorState?.requestKey === requestKey ? errorState.message : null;
  const refreshing = listState !== null && listState.requestKey !== requestKey;

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Recebíveis</h1>
        <p className="mt-2 text-muted-foreground">
          Acompanhe valores a receber, pagamentos registrados e cobranças em atraso.
        </p>
      </div>

      <div className="mt-8">
        <ReceivablesSummary financial={financial} />
      </div>

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {refreshing && (
          <Skeleton className="absolute inset-x-0 top-0 z-10 h-1 rounded-none motion-reduce:animate-none" />
        )}

        <ReceivablesFilters
          status={status}
          overdue={overdue}
          onStatusChange={(next) => {
            setPage(1);
            setStatus(next);
          }}
          onOverdueChange={(next) => {
            setPage(1);
            setOverdue(next);
          }}
        />

        {error && !data ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => setRefreshVersion((value) => value + 1)}
              className="mt-5 cursor-pointer"
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data ? (
          <ReceivableListSkeleton />
        ) : (
          <>
            {error && (
              <p className="m-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <ReceivablesTable
              data={data}
              page={page}
              refreshing={refreshing}
              onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
              onNextPage={() => setPage((value) => value + 1)}
            />
          </>
        )}
      </section>
    </div>
  );
}
