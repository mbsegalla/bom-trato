import Link from 'next/link';

import { ListPagination } from '@/components/listPagination';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import type { WorkOrderPage } from '../../../types/workOrder.types';
import { WorkOrderStatusBadge } from '../../workOrderStatusBadge';

interface WorkOrdersTableProps {
  data: WorkOrderPage;
  page: number;
  onPageChange: (page: number) => void;
}

export function WorkOrdersTable({ data, page, onPageChange }: WorkOrdersTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-240 border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3">Serviço</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Responsável</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Agendamento</th>
              <th className="px-5 py-3">Valor</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.items.map((workOrder) => (
              <tr key={workOrder.id} className="transition-colors hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/work-orders/${workOrder.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {workOrder.title}
                  </Link>
                </td>

                <td className="px-5 py-3.5 text-sm">{workOrder.customerName}</td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {workOrder.assignedToName ?? 'Sem responsável'}
                </td>

                <td className="px-5 py-3.5">
                  <WorkOrderStatusBadge status={workOrder.status} />
                </td>

                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {formatDateTime(workOrder.scheduledStartAt, 'Ainda não agendado')}
                </td>

                <td className="px-5 py-3.5 font-medium">{formatBrlCurrency(workOrder.totalInCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPagination
        page={page}
        hasMore={data.hasMore}
        onPrevious={() => onPageChange(Math.max(1, page - 1))}
        onNext={() => onPageChange(page + 1)}
      />
    </>
  );
}
