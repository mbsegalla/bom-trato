'use client';

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileText,
  Plus,
  WalletCards,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatShortDate, formatTime } from '@/shared/formatters/date.formatter';

import { getDashboard } from '../services/dashboard.service';
import type { DashboardData } from '../types/dashboard.types';
import { DashboardSkeleton } from './dashboardSkeleton';

interface DashboardState {
  organizationId: string;
  data: DashboardData;
}

interface DashboardErrorState {
  organizationId: string;
  message: string;
}

export function DashboardContent() {
  const router = useRouter();

  const { activeOrganization } = useApp();

  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [dashboardError, setDashboardError] = useState<DashboardErrorState | null>(null);

  useEffect(() => {
    let active = true;

    void getDashboard(activeOrganization.id)
      .then((result) => {
        if (!active) {
          return;
        }

        setDashboardError(null);

        setDashboardState({
          organizationId: activeOrganization.id,
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

        setDashboardError({
          organizationId: activeOrganization.id,
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar sua visão geral.',
        });
      });

    return () => {
      active = false;
    };
  }, [activeOrganization.id, router]);

  const data = dashboardState?.organizationId === activeOrganization.id ? dashboardState.data : null;

  const error = dashboardError?.organizationId === activeOrganization.id ? dashboardError.message : null;

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Não conseguimos carregar sua visão geral</h1>

        <p role="alert" className="mt-3 text-sm leading-relaxed text-destructive">
          {error}
        </p>

        <Button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 min-h-11 cursor-pointer rounded-xl"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const attentionItems = [
    data.summary.quotes.awaitingApproval > 0
      ? {
          id: 'awaiting-quotes',
          label: `${data.summary.quotes.awaitingApproval} ${
            data.summary.quotes.awaitingApproval === 1
              ? 'orçamento aguardando resposta'
              : 'orçamentos aguardando resposta'
          }`,
          href: '/quotes',
        }
      : null,
    data.summary.quotes.expiredSent > 0
      ? {
          id: 'expired-quotes',
          label: `${data.summary.quotes.expiredSent} ${
            data.summary.quotes.expiredSent === 1 ? 'orçamento enviado expirou' : 'orçamentos enviados expiraram'
          }`,
          href: '/quotes',
        }
      : null,
    data.financial.currentReceivables.overdueCount > 0
      ? {
          id: 'overdue-receivables',
          label: `${data.financial.currentReceivables.overdueCount} ${
            data.financial.currentReceivables.overdueCount === 1
              ? 'recebível está em atraso'
              : 'recebíveis estão em atraso'
          }`,
          href: '/receivables',
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Seu dia, mais organizado.</h1>

          <p className="mt-2 text-muted-foreground">Acompanhe os serviços e cuide dos próximos passos.</p>
        </div>

        <Link
          href="/quotes"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus aria-hidden="true" className="size-5" />
          Novo orçamento
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-success-surface text-success">
              <WalletCards aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Recebido no mês</p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                {formatBrlCurrency(data.financial.periodReceipts.amountInCents)}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {data.financial.periodReceipts.count}{' '}
                {data.financial.periodReceipts.count === 1 ? 'pagamento registrado' : 'pagamentos registrados'}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning-surface text-warning">
              <Clock3 aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">A receber</p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                {formatBrlCurrency(data.financial.currentReceivables.pendingAmountInCents)}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {data.financial.currentReceivables.pendingCount}{' '}
                {data.financial.currentReceivables.pendingCount === 1 ? 'cobrança pendente' : 'cobranças pendentes'}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-primary">
              <Wrench aria-hidden="true" className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Serviços em andamento</p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
                {data.summary.workOrders.inProgress}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {data.summary.workOrders.scheduled} agendados para os próximos passos
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <CalendarDays aria-hidden="true" className="size-5 text-primary" />

              <h2 className="font-heading text-lg font-semibold">Próximos agendamentos</h2>
            </div>

            <Link href="/schedule" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {data.upcoming.items.length === 0 ? (
            <div className="py-10 text-center">
              <CircleCheck aria-hidden="true" className="mx-auto size-8 text-success" />

              <p className="mt-3 text-sm text-muted-foreground">Nenhum serviço agendado para os próximos passos.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.upcoming.items.map((workOrder) => (
                <div key={workOrder.id} className="grid gap-3 py-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold">{formatTime(workOrder.scheduledStartAt)}</p>

                    <p className="text-xs text-muted-foreground">{formatShortDate(workOrder.scheduledStartAt)}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{workOrder.title}</p>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {workOrder.customerName}
                      {workOrder.assignedTo ? ` · ${workOrder.assignedTo.name}` : ''}
                    </p>
                  </div>

                  <ArrowRight aria-hidden="true" className="hidden size-4 text-muted-foreground sm:block" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle aria-hidden="true" className="size-5 text-warning" />

              <h2 className="font-heading text-lg font-semibold">Precisa da sua atenção</h2>
            </div>
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-10 text-center">
              <CircleCheck aria-hidden="true" className="mx-auto size-8 text-success" />

              <p className="mt-3 text-sm text-muted-foreground">Tudo em ordem por aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-4 py-4 text-sm font-medium hover:text-primary"
                >
                  <span>{item.label}</span>

                  <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <FileText aria-hidden="true" className="size-5 text-primary" />

          <h2 className="font-heading text-lg font-semibold">Resumo operacional</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Orçamentos em rascunho</p>

            <p className="mt-2 text-2xl font-semibold">{data.summary.quotes.draft}</p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Aguardando resposta</p>

            <p className="mt-2 text-2xl font-semibold">{data.summary.quotes.awaitingApproval}</p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Ordens abertas</p>

            <p className="mt-2 text-2xl font-semibold">{data.summary.workOrders.open}</p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Valor em atraso</p>

            <p className="mt-2 text-2xl font-semibold">
              {formatBrlCurrency(data.financial.currentReceivables.overdueAmountInCents)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Banknote aria-hidden="true" className="size-3.5" />
          Atualizado às {formatTime(data.summary.generatedAt)}
        </div>
      </section>
    </div>
  );
}
