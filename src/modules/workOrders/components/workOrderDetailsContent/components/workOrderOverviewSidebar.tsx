import { CalendarClock, ClipboardList, MapPin, UserRound } from 'lucide-react';
import Link from 'next/link';

import type { OrganizationMember } from '@/modules/organizations/types/organization.types';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';

import type { WorkOrder } from '../../../types/workOrder.types';

interface WorkOrderOverviewSidebarProps {
  workOrder: WorkOrder;
  assignedMember?: OrganizationMember;
}

export function WorkOrderOverviewSidebar({ workOrder, assignedMember }: WorkOrderOverviewSidebarProps) {
  return (
    <aside className="rounded-xl bg-muted/40 p-5 ring-1 ring-border/60">
      <section>
        <h2 className="font-heading text-lg font-semibold">Planejamento</h2>

        <div className="mt-5 space-y-5">
          <div className="flex items-start gap-3">
            <UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="mt-1 text-sm font-medium">{assignedMember?.user.name ?? 'Ainda não definido'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="mt-1 text-sm font-medium whitespace-pre-wrap">
                {workOrder.serviceAddress ?? 'Ainda não definido'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Agendamento</p>
              <p className="mt-1 text-sm font-medium">
                {workOrder.scheduledStartAt
                  ? `${formatDateTime(workOrder.scheduledStartAt)} → ${formatDateTime(workOrder.scheduledEndAt)}`
                  : 'Ainda não agendado'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">Cliente</h2>

        <Link
          href={`/customers/${workOrder.customerId}`}
          className="mt-4 block font-medium hover:text-primary hover:underline"
        >
          {workOrder.customerName}
        </Link>

        {workOrder.customerEmail && <p className="mt-2 text-sm text-muted-foreground">{workOrder.customerEmail}</p>}

        {workOrder.customerPhone && <p className="mt-1 text-sm text-muted-foreground">{workOrder.customerPhone}</p>}
      </section>

      <section className="mt-6 border-t border-border pt-6">
        <h2 className="font-heading text-lg font-semibold">Resumo financeiro</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBrlCurrency(workOrder.subtotalInCents)}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Desconto</span>
            <span>- {formatBrlCurrency(workOrder.discountInCents)}</span>
          </div>

          <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatBrlCurrency(workOrder.totalInCents)}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <ClipboardList aria-hidden="true" className="size-4 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Instruções</h2>
        </div>

        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {workOrder.instructions ?? 'Nenhuma instrução cadastrada.'}
        </p>
      </section>
    </aside>
  );
}
