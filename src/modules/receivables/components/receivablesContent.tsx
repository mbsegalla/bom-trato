'use client';

import { AlertTriangle, Banknote, ChevronLeft, ChevronRight, Receipt, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDate } from '@/shared/formatters/date.formatter';

import { receivableStatusOptions } from '../constants/receivable.constants';
import { getReceivableFinancial, listReceivables } from '../services/receivable.service';
import type { ReceivableFinancial, ReceivableListStatus, ReceivablePage } from '../types/receivable.types';
import { ReceivableListSkeleton, ReceivableSummarySkeleton } from './receivableSkeletons';
import { ReceivableStatusBadge } from './receivableStatusBadge';

type OverdueFilter = 'ALL' | 'OVERDUE' | 'ON_TIME';

interface ListState {
  requestKey: string;
  data: ReceivablePage;
}

interface ReceivableListErrorState {
  requestKey: string;
  message: string;
}

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
        if (active) {
          setFinancial(result);
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
        }
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
        if (!active) {
          return;
        }

        setErrorState(null);

        setListState({
          requestKey,
          data: result,
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

  function changeStatus(nextStatus: ReceivableListStatus): void {
    setPage(1);
    setStatus(nextStatus);
  }

  function changeOverdue(nextOverdue: OverdueFilter): void {
    setPage(1);
    setOverdue(nextOverdue);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Recebíveis</h1>

        <p className="mt-2 text-muted-foreground">
          Acompanhe valores a receber, pagamentos registrados e cobranças em atraso.
        </p>
      </div>

      <div className="mt-8">
        {financial ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                  <WalletCards className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">A receber</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatBrlCurrency(financial.currentReceivables.pendingAmountInCents)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-warning-surface text-warning">
                  <AlertTriangle className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Em atraso</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatBrlCurrency(financial.currentReceivables.overdueAmountInCents)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-success-surface text-success">
                  <Banknote className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Recebido no mês</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatBrlCurrency(financial.periodReceipts.amountInCents)}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                  <Receipt className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Pendências</p>
                  <p className="mt-1 text-2xl font-semibold">{financial.currentReceivables.pendingCount}</p>
                </div>
              </div>
            </article>
          </div>
        ) : (
          <ReceivableSummarySkeleton />
        )}
      </div>

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {refreshing && (
          <Skeleton className="absolute inset-x-0 top-0 z-10 h-1 rounded-none motion-reduce:animate-none" />
        )}

        <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
            {receivableStatusOptions.map((option) => (
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

          <select
            value={overdue}
            onChange={(event) => changeOverdue(event.target.value as OverdueFilter)}
            className="h-10 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="ALL">Todas as situações</option>
            <option value="OVERDUE">Somente atrasados</option>
            <option value="ON_TIME">Sem atraso</option>
          </select>
        </div>

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
        ) : data.items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-primary">
              <WalletCards className="size-6" />
            </div>

            <h2 className="mt-5 font-heading text-xl font-semibold">Nenhum recebível por aqui</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Recebíveis podem ser criados a partir das ordens de serviço concluídas.
            </p>

            <Link
              href="/work-orders"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Ver ordens de serviço
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="m-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div
              className={
                refreshing ? 'overflow-x-auto opacity-60 transition-opacity' : 'overflow-x-auto transition-opacity'
              }
            >
              <table className="w-full min-w-240 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3">Recebível</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Valor</th>
                    <th className="px-6 py-3">Recebido</th>
                    <th className="px-6 py-3">Saldo</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {data.items.map((receivable) => (
                    <tr key={receivable.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <Link
                          href={`/receivables/${receivable.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {receivable.title}
                        </Link>

                        <p className="mt-1 text-sm text-muted-foreground">{receivable.customerName}</p>
                      </td>

                      <td className="px-6 py-4">
                        <ReceivableStatusBadge status={receivable.status} overdue={receivable.overdue} />
                      </td>

                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(receivable.dueAt)}</td>

                      <td className="px-6 py-4 font-medium">{formatBrlCurrency(receivable.amountInCents)}</td>

                      <td className="px-6 py-4 text-sm">{formatBrlCurrency(receivable.receivedInCents)}</td>

                      <td className="px-6 py-4 font-semibold text-primary">
                        {formatBrlCurrency(receivable.balanceInCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-sm text-muted-foreground">Página {data.page}</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!data.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                  className="cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
