'use client';

import { CalendarClock, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SessionError } from '@/modules/auth/services/session.service';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import { getWorkOrderScheduleHistory } from '../services/workOrder.service';
import type { WorkOrderScheduleHistoryPage } from '../types/workOrder.types';

interface WorkOrderScheduleHistoryProps {
  organizationId: string;
  workOrderId: string;
  version: number;
  members: OrganizationMember[];
}

interface ScheduleHistoryState {
  requestKey: string;
  data: WorkOrderScheduleHistoryPage;
}

export function WorkOrderScheduleHistory({
  organizationId,
  workOrderId,
  version,
  members,
}: WorkOrderScheduleHistoryProps) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [state, setState] = useState<ScheduleHistoryState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestKey = `${organizationId}:${workOrderId}:${version}:${page}`;

  useEffect(() => {
    let active = true;

    void getWorkOrderScheduleHistory(organizationId, workOrderId, version, page)
      .then((result) => {
        if (!active) {
          return;
        }

        setError(null);

        setState({
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

        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico de agenda.');
      });

    return () => {
      active = false;
    };
  }, [organizationId, page, requestKey, router, version, workOrderId]);

  const data = state?.requestKey === requestKey ? state.data : null;

  function memberName(userId: string | null): string {
    if (userId === null) {
      return 'Sem responsável';
    }

    return members.find((member) => member.userId === userId)?.user.name ?? 'Membro indisponível';
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <CalendarClock aria-hidden="true" className="size-5 text-primary" />

        <h2 className="font-heading text-lg font-semibold">Histórico de agenda</h2>
      </div>

      {error ? (
        <p className="mt-5 text-sm text-destructive">{error}</p>
      ) : !data ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Carregando histórico...
        </div>
      ) : data.items.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Nenhuma alteração de agenda registrada.</p>
      ) : (
        <>
          <div className="mt-5 space-y-4">
            {data.items.map((entry) => (
              <div key={entry.id} className="border-l-2 border-border pl-4">
                <p className="text-sm font-medium">
                  {entry.toStartAt === null
                    ? 'Agendamento removido'
                    : `${formatDateTime(entry.toStartAt)} → ${formatDateTime(entry.toEndAt)}`}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">Responsável: {memberName(entry.toAssignedToId)}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)} · versão {entry.version}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-2">
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
              disabled={!data.hasMore}
              onClick={() => setPage((value) => value + 1)}
              className="cursor-pointer"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
