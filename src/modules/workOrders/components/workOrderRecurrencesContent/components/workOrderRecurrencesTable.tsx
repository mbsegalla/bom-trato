import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type {
  WorkOrderRecurrence,
  WorkOrderRecurrenceList,
  WorkOrderRecurrenceListItem,
} from '../../../types/workOrderRecurrence.types';

interface WorkOrderRecurrencesTableProps {
  data: WorkOrderRecurrenceList;
  pendingWorkOrderId: string | null;
  onToggle: (item: WorkOrderRecurrenceListItem) => void;
  onPageChange: (page: number) => void;
}

function formatFrequency(recurrence: WorkOrderRecurrence): string {
  const { intervalCount, intervalUnit } = recurrence;
  const labels = {
    DAY: ['dia', 'dias'],
    WEEK: ['semana', 'semanas'],
    MONTH: ['mês', 'meses'],
  };

  return `A cada ${intervalCount} ${labels[intervalUnit][intervalCount === 1 ? 0 : 1]}`;
}

function getVisitLabel(item: WorkOrderRecurrenceListItem, today: string, upcomingUntil: string): string | null {
  if (!item.recurrence.enabled || item.customerArchived) {
    return null;
  }

  const { nextVisitOn } = item.recurrence;

  if (nextVisitOn < today) return 'Em atraso';
  if (nextVisitOn === today) return 'Hoje';
  if (nextVisitOn <= upcomingUntil) return 'Nos próximos 7 dias';

  return null;
}

export function WorkOrderRecurrencesTable({
  data,
  pendingWorkOrderId,
  onToggle,
  onPageChange,
}: WorkOrderRecurrencesTableProps) {
  const end = new Date(`${data.today}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  const upcomingUntil = end.toISOString().slice(0, 10);

  return (
    <>
      {data.items.length === 0 ? (
        <p className="border-b border-border py-10 text-center text-sm text-muted-foreground">
          Nenhum serviço recorrente encontrado. Você pode configurar uma recorrência em uma ordem de serviço concluída.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3 text-left">Serviço</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-center">Frequência</th>
                <th className="px-5 py-3 text-center">Próxima visita</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item) => {
                const { recurrence, customerArchived, workOrderId } = item;
                const visitLabel = getVisitLabel(item, data.today, upcomingUntil);
                const canToggle =
                  data.canConfigure &&
                  (recurrence.enabled || (!customerArchived && recurrence.nextVisitOn >= data.today));

                return (
                  <tr key={workOrderId} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5 align-middle">
                      <Link
                        href={`/work-orders/${workOrderId}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {item.title}
                      </Link>
                      {recurrence.lastGeneratedQuoteId && (
                        <Link
                          href={`/quotes/${recurrence.lastGeneratedQuoteId}`}
                          className="mt-1 block text-xs text-primary hover:underline"
                        >
                          Último orçamento gerado
                        </Link>
                      )}
                    </td>

                    <td className="px-5 py-3.5 align-middle text-sm">{item.customerName}</td>

                    <td className="px-5 py-3.5 text-center align-middle text-sm">
                      <p>{formatFrequency(recurrence)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {recurrence.autoGenerateEnabled ? 'Geração automática configurada' : 'Geração manual'}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 text-center align-middle text-sm">
                      <p>{recurrence.nextVisitOn.split('-').reverse().join('/')}</p>
                      {visitLabel && (
                        <p
                          className={cn(
                            'mt-1 text-xs font-medium',
                            visitLabel === 'Em atraso' ? 'text-destructive' : 'text-primary',
                          )}
                        >
                          {visitLabel}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-center align-middle">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-3 py-1 text-xs font-medium',
                          customerArchived
                            ? 'bg-warning-surface text-warning'
                            : recurrence.enabled
                              ? 'bg-success-surface text-success'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {customerArchived ? 'Cliente arquivado' : recurrence.enabled ? 'Ativa' : 'Pausada'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right align-middle">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/work-orders/${workOrderId}#recurrence`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {data.canConfigure ? 'Gerenciar' : 'Consultar'}
                        </Link>

                        {canToggle && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={pendingWorkOrderId !== null}
                            onClick={() => onToggle(item)}
                            className="min-h-11 cursor-pointer"
                          >
                            {pendingWorkOrderId === workOrderId && (
                              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                            )}
                            {recurrence.enabled ? 'Pausar' : 'Reativar'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(data.page > 1 || data.hasMore) && (
        <ListPagination
          page={data.page}
          hasMore={data.hasMore}
          onPrevious={() => onPageChange(Math.max(1, data.page - 1))}
          onNext={() => onPageChange(data.page + 1)}
        />
      )}
    </>
  );
}
