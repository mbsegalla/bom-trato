import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import type { WorkOrderPage } from '../../../types/workOrder.types';
import { WorkOrderStatusBadge } from '../../workOrderStatusBadge';

interface WorkOrdersTableProps {
  data: WorkOrderPage;
  members: OrganizationMember[];
  page: number;
  onPageChange: (page: number) => void;
}

export function WorkOrdersTable({ data, members, page, onPageChange }: WorkOrdersTableProps) {
  function memberName(userId: string | null): string {
    if (userId === null) {
      return 'Sem responsável';
    }

    return members.find((member) => member.userId === userId)?.user.name ?? 'Membro indisponível';
  }

  return (
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
            {data.items.map((workOrder) => (
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
        <p className="text-sm text-muted-foreground">Página {data.page}</p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="cursor-pointer"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!data.hasMore}
            onClick={() => onPageChange(page + 1)}
            className="cursor-pointer"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </footer>
    </>
  );
}
