import { Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Quote, QuoteItem } from '@/modules/quotes/types/quote.types';
import { getServiceUnitLabel } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { formatBrlCurrency } from '@/shared/formatters/currency.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

interface QuoteItemsSectionProps {
  quote: Quote;
  draft: boolean;
  onAdd: () => void;
  onEdit: (item: QuoteItem) => void;
  onRemove: (item: QuoteItem) => void;
}

export function QuoteItemsSection({ quote, draft, onAdd, onEdit, onRemove }: QuoteItemsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Itens do orçamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
          </p>
        </div>

        {draft && (
          <Button type="button" variant="outline" onClick={onAdd} className="cursor-pointer">
            <Plus aria-hidden="true" className="size-4" />
            Adicionar
          </Button>
        )}
      </div>

      {quote.items.length === 0 ? (
        <div className="py-10">
          <p className="font-medium">Este orçamento ainda não possui itens.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione pelo menos um serviço antes de enviar o orçamento ao cliente.
          </p>

          {draft && (
            <Button type="button" onClick={onAdd} className="mt-5 cursor-pointer">
              <Plus aria-hidden="true" className="size-4" />
              Adicionar primeiro item
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {[...quote.items]
            .sort((left, right) => left.position - right.position)
            .map((item) => (
              <div key={item.id} className="py-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatQuantity(item.quantityInThousandths)} {getServiceUnitLabel(item.unit)}
                      {' · '}
                      {formatBrlCurrency(item.unitAmountInCents)} por unidade
                    </p>

                    {item.description && (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{formatBrlCurrency(item.totalInCents)}</p>

                    {draft && (
                      <div className="mt-2 flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => onEdit(item)}
                          className="cursor-pointer"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${item.name}`}
                          onClick={() => onRemove(item)}
                          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
