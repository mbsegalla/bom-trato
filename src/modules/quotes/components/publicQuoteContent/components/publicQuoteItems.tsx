import type { PublicQuote } from '@/modules/quotes/types/quote.types';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

interface PublicQuoteItemsProps {
  items: PublicQuote['items'];
}

export function PublicQuoteItems({ items }: PublicQuoteItemsProps) {
  return (
    <div className="divide-y divide-border rounded-2xl border border-border">
      {items.map((item, index) => (
        <div key={`${item.name}:${index}`} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{item.name}</p>

              <p className="mt-1 text-sm text-muted-foreground">
                {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                {' · '}
                {formatBrlCurrency(item.unitAmountInCents)}
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
  );
}
