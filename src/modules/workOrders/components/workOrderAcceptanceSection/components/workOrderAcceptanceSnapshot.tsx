import { ChevronDown } from 'lucide-react';

import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatDateTime } from '@/shared/formatters/date.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import type { WorkOrderAcceptanceSnapshot as AcceptanceSnapshot } from '../../../types/workOrderAcceptance.types';

interface WorkOrderAcceptanceSnapshotProps {
  snapshot: AcceptanceSnapshot;
}

export function WorkOrderAcceptanceSnapshot({ snapshot }: WorkOrderAcceptanceSnapshotProps) {
  const { workOrder } = snapshot;
  const items = [...workOrder.items].sort((left, right) => left.position - right.position);

  return (
    <details className="group mt-6 min-w-0 rounded-xl border border-border bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        Serviços registrados no aceite
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>

      <div className="border-t border-border px-5 pt-5 pb-6">
        <p className="text-xs wrap-break-word text-muted-foreground">{snapshot.organizationName}</p>

        <h3 className="mt-1 font-heading text-lg font-semibold wrap-break-word">{workOrder.title}</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Conclusão registrada em {formatDateTime(workOrder.completedAt)}
        </p>

        <ul className="mt-5 divide-y divide-border">
          {items.map((item, index) => (
            <li key={`${item.position}:${index}`} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1 basis-32">
                  <p className="text-sm font-medium wrap-break-word">{item.name}</p>

                  <p className="mt-1 text-xs wrap-break-word text-muted-foreground">
                    {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)} ·{' '}
                    {formatBrlCurrency(item.unitAmountInCents)} / unidade
                  </p>
                </div>

                <p className="ml-auto max-w-full shrink-0 text-right text-sm font-medium wrap-break-word tabular-nums">
                  {formatBrlCurrency(item.totalInCents)}
                </p>
              </div>

              {item.description && (
                <p className="mt-2 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-3 border-t border-border pt-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="ml-auto max-w-full min-w-0 text-right wrap-break-word tabular-nums">
              {formatBrlCurrency(workOrder.subtotalInCents)}
            </dd>
          </div>

          {workOrder.discountInCents > 0 && (
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="ml-auto max-w-full min-w-0 text-right wrap-break-word tabular-nums">
                - {formatBrlCurrency(workOrder.discountInCents)}
              </dd>
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 font-medium">
            <dt>Valor contratado</dt>
            <dd className="ml-auto max-w-full min-w-0 text-right wrap-break-word tabular-nums">
              {formatBrlCurrency(workOrder.totalInCents)}
            </dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
