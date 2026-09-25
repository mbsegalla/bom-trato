'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useApp } from '@/modules/app/components/appProvider';
import { SessionError } from '@/modules/auth/services/session.service';
import { listOrganizationMembers } from '@/modules/organizations/services/organization.service';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { changeMonth, createMonthDate, getMonthRange } from '../../helpers/scheduleCalendar.helper';
import { listSchedule } from '../../services/schedule.service';
import type { ScheduleData, ScheduleLateFilter, ScheduleStatusFilter } from '../../types/schedule.types';
import { ScheduleCalendarSkeleton, ScheduleSummarySkeleton } from '../scheduleSkeleton';
import { ScheduleCalendar } from './components/scheduleCalendar';
import { ScheduleFilters } from './components/scheduleFilters';
import { ScheduleSummary } from './components/scheduleSummary';
import { ScheduleToolbar } from './components/scheduleToolbar';

interface ScheduleState {
  requestKey: string;
  data: ScheduleData;
}

export function ScheduleContent() {
  const { activeOrganization } = useApp();
  return <OrganizationScheduleContent key={activeOrganization.id} organizationId={activeOrganization.id} />;
}

function OrganizationScheduleContent({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(() => createMonthDate(new Date()));
  const [assignedToId, setAssignedToId] = useState('ALL');
  const [status, setStatus] = useState<ScheduleStatusFilter>('ALL');
  const [late, setLate] = useState<ScheduleLateFilter>('ALL');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [state, setState] = useState<ScheduleState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const range = getMonthRange(month);
  const requestKey = [
    organizationId,
    range.from.toISOString(),
    range.to.toISOString(),
    assignedToId,
    status,
    late,
    refreshVersion,
  ].join(':');

  useEffect(() => {
    let active = true;

    void listOrganizationMembers(organizationId)
      .then((result) => {
        if (active) {
          setMembers(result);
          setMembersError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setMembersError(cause instanceof Error ? cause.message : 'Não foi possível carregar os responsáveis.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, router]);

  useEffect(() => {
    let active = true;

    void listSchedule(organizationId, range, {
      assignedToId: assignedToId === 'ALL' ? null : assignedToId,
      status,
      late,
    })
      .then((result) => {
        if (active) {
          setError(null);
          setState({ requestKey, data: result });
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os agendamentos.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedToId, late, month, organizationId, requestKey, router, status]);

  const data = state?.data ?? null;
  const refreshing = state !== null && state.requestKey !== requestKey;

  function clearFilters(): void {
    setAssignedToId('ALL');
    setStatus('ALL');
    setLate('ALL');
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Agendamentos</h1>
        <p className="mt-2 text-muted-foreground">Visualize os serviços programados e acompanhe a rotina da equipe.</p>
      </div>

      <div className="mt-8">{data ? <ScheduleSummary data={data} /> : <ScheduleSummarySkeleton />}</div>

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <ScheduleToolbar
            month={month}
            loading={!data && error === null}
            onPreviousMonth={() => setMonth((current) => changeMonth(current, -1))}
            onNextMonth={() => setMonth((current) => changeMonth(current, 1))}
            onToday={() => setMonth(createMonthDate(new Date()))}
            onRefresh={() => setRefreshVersion((value) => value + 1)}
          />
          <div className="mt-5 border-t border-border pt-5">
            <ScheduleFilters
              members={members}
              assignedToId={assignedToId}
              status={status}
              late={late}
              onAssignedToChange={setAssignedToId}
              onStatusChange={setStatus}
              onLateChange={setLate}
              onClear={clearFilters}
            />
            {membersError && <p className="mt-3 text-sm text-destructive">{membersError}</p>}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error ? (
            <div className="py-14 text-center">
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefreshVersion((value) => value + 1)}
                className="mt-5 cursor-pointer"
              >
                Tentar novamente
              </Button>
            </div>
          ) : !data ? (
            <ScheduleCalendarSkeleton />
          ) : (
            <>
              {data.items.length === 0 && (
                <div className="mb-5 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Nenhum serviço corresponde aos filtros selecionados neste mês.
                </div>
              )}
              <div
                aria-busy={refreshing}
                className={
                  refreshing
                    ? 'pointer-events-none opacity-60 transition-opacity duration-150'
                    : 'transition-opacity duration-150'
                }
              >
                <ScheduleCalendar month={month} items={data.items} />
              </div>
              <p className="mt-4 text-right text-xs text-muted-foreground">
                Agenda atualizada em {formatDateTime(data.generatedAt)}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
