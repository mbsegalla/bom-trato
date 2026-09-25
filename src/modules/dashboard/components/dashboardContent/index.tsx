'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { DashboardSkeleton } from '@/modules/dashboard/components/dashboardSkeleton';
import { getDashboard } from '@/modules/dashboard/services/dashboard.service';
import type { DashboardData } from '@/modules/dashboard/types/dashboard.types';

import { AttentionCard, type DashboardAttentionItem } from './components/attentionCard';
import { DashboardHeader } from './components/dashboardHeader';
import { DashboardSummaryCards } from './components/dashboardSummaryCards';
import { OperationalSummary } from './components/operationalSummary';
import { UpcomingScheduleCard } from './components/upcomingScheduleCard';

interface DashboardState {
  organizationId: string;
  data: DashboardData;
}

interface DashboardErrorState {
  organizationId: string;
  message: string;
}

function buildAttentionItems(data: DashboardData): DashboardAttentionItem[] {
  return [
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
  ].filter((item): item is DashboardAttentionItem => item !== null);
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
        if (!active) return;
        setDashboardError(null);
        setDashboardState({ organizationId: activeOrganization.id, data: result });
      })
      .catch((cause: unknown) => {
        if (!active) return;

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

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeader />
      <DashboardSummaryCards data={data} />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <UpcomingScheduleCard items={data.upcoming.items} />
        <AttentionCard items={buildAttentionItems(data)} />
      </div>
      <OperationalSummary data={data} />
    </div>
  );
}
