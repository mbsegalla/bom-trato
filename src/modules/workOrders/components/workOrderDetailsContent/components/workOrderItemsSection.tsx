import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import type { WorkOrder } from '../../../types/workOrder.types';

export function WorkOrderItemsSection({ workOrder }: { workOrder: WorkOrder }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="font-heading text-lg font-semibold">Serviços</h2>
        <p className="mt-1 text-sm text-muted-foreground">Itens originados do orçamento aprovado.</p>
      </div>

      <div className="divide-y divide-border">
        {[...workOrder.items]
          .sort((left, right) => left.position - right.position)
          .map((item) => (
            <div key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)} ·{' '}
                    {formatBrlCurrency(item.unitAmountInCents)} por unidade
                  </p>

                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  )}
                </div>

                <p className="shrink-0 font-semibold">{formatBrlCurrency(item.totalInCents)}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
