'use client';

import { LoaderCircle, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SessionError } from '@/modules/auth/services/session.service';
import { getServiceUnitLabel, serviceUnitOptions } from '@/modules/serviceCatalog/constants/catalogService.constants';
import { listCatalogServices } from '@/modules/serviceCatalog/services/catalogService.service';
import type { CatalogServicePage } from '@/modules/serviceCatalog/types/catalogService.types';
import { formatBrlCurrency, formatBrlCurrencyInput } from '@/shared/formatters/currency.formatter';
import { formatQuantity } from '@/shared/formatters/quantity.formatter';

import { catalogQuoteItemFormSchema, customQuoteItemFormSchema } from '../schemas/quote.schema';
import { addQuoteItem, replaceQuoteItem } from '../services/quote.service';
import type { Quote, QuoteItem } from '../types/quote.types';

interface QuoteItemFormPanelProps {
  quote: Quote;
  item?: QuoteItem;
  onClose(): void;
  onSaved(quote: Quote): void;
}

interface CatalogState {
  requestKey: string;
  data: CatalogServicePage;
}

type ItemMode = 'CATALOG' | 'CUSTOM';

export function QuoteItemFormPanel({ quote, item, onClose, onSaved }: QuoteItemFormPanelProps) {
  const router = useRouter();

  const submittingRef = useRef(false);

  const [mode, setMode] = useState<ItemMode>(item?.catalogServiceId ? 'CATALOG' : item ? 'CUSTOM' : 'CATALOG');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [catalogState, setCatalogState] = useState<CatalogState | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const requestKey = `${quote.organizationId}:${search}`;

  const loadCatalog = mode === 'CATALOG' && item === undefined;

  useEffect(() => {
    if (!loadCatalog) {
      return;
    }

    let active = true;

    void listCatalogServices(quote.organizationId, {
      page: 1,
      limit: 100,
      status: 'ACTIVE',
      search,
    })
      .then((result) => {
        if (!active) {
          return;
        }

        setCatalogError(null);

        setCatalogState({
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

        setCatalogError(cause instanceof Error ? cause.message : 'Não foi possível carregar o catálogo.');
      });

    return () => {
      active = false;
    };
  }, [loadCatalog, quote.organizationId, requestKey, router, search]);

  const services = catalogState?.requestKey === requestKey ? catalogState.data.items : null;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    let input;

    if (mode === 'CATALOG') {
      const parsed = catalogQuoteItemFormSchema.safeParse({
        catalogServiceId: item?.catalogServiceId ?? String(data.get('catalogServiceId') ?? ''),
        quantity: String(data.get('quantity') ?? ''),
      });

      if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;

        setFieldErrors({
          catalogServiceId: errors.catalogServiceId?.[0],
          quantity: errors.quantity?.[0],
        });

        return;
      }

      input = {
        version: quote.version,
        catalogServiceId: parsed.data.catalogServiceId,
        quantity: parsed.data.quantity,
      };
    } else {
      const parsed = customQuoteItemFormSchema.safeParse({
        name: String(data.get('name') ?? ''),
        description: String(data.get('description') ?? ''),
        unit: String(data.get('unit') ?? ''),
        quantity: String(data.get('quantity') ?? ''),
        unitAmountInCents: String(data.get('unitAmountInCents') ?? ''),
      });

      if (!parsed.success) {
        const errors = parsed.error.flatten().fieldErrors;

        setFieldErrors({
          name: errors.name?.[0],
          description: errors.description?.[0],
          unit: errors.unit?.[0],
          quantity: errors.quantity?.[0],
          unitAmountInCents: errors.unitAmountInCents?.[0],
        });

        return;
      }

      input = {
        version: quote.version,
        quantity: parsed.data.quantity,
        custom: {
          name: parsed.data.name,
          description: parsed.data.description,
          unit: parsed.data.unit,
          unitAmountInCents: parsed.data.unitAmountInCents,
        },
      };
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const updated =
        item === undefined
          ? await addQuoteItem(quote.organizationId, quote.id, input)
          : await replaceQuoteItem(quote.organizationId, quote.id, item.id, input);

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o item.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">{item ? 'Editar item' : 'Adicionar item'}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Use um serviço do catálogo ou adicione um item específico.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {!item && (
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  <Button
                    type="button"
                    variant={mode === 'CATALOG' ? 'default' : 'ghost'}
                    onClick={() => setMode('CATALOG')}
                    className="cursor-pointer"
                  >
                    Do catálogo
                  </Button>

                  <Button
                    type="button"
                    variant={mode === 'CUSTOM' ? 'default' : 'ghost'}
                    onClick={() => setMode('CUSTOM')}
                    className="cursor-pointer"
                  >
                    Personalizado
                  </Button>
                </div>
              )}

              {mode === 'CATALOG' && item ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="font-medium">{item.name}</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {getServiceUnitLabel(item.unit)} · {formatBrlCurrency(item.unitAmountInCents)}
                  </p>
                </div>
              ) : mode === 'CATALOG' ? (
                <>
                  <div className="space-y-2">
                    <Label>Buscar no catálogo</Label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                        />

                        <Input
                          value={searchDraft}
                          onChange={(event) => setSearchDraft(event.target.value)}
                          className="h-11 rounded-xl pl-10"
                          placeholder="Buscar serviço..."
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSearch(searchDraft.trim())}
                        className="cursor-pointer"
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-catalog-service">Serviço *</Label>

                    {!services ? (
                      <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
                    ) : services.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum serviço ativo encontrado.</p>
                    ) : (
                      <select
                        id="quote-catalog-service"
                        name="catalogServiceId"
                        defaultValue=""
                        className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="" disabled>
                          Selecione um serviço
                        </option>

                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} · {formatBrlCurrency(service.amountInCents)}
                          </option>
                        ))}
                      </select>
                    )}

                    {catalogError && <p className="text-sm text-destructive">{catalogError}</p>}

                    {fieldErrors.catalogServiceId && (
                      <p className="text-sm text-destructive">{fieldErrors.catalogServiceId}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quote-custom-name">Nome *</Label>

                    <Input
                      id="quote-custom-name"
                      name="name"
                      defaultValue={item?.name ?? ''}
                      maxLength={100}
                      className="h-12 rounded-xl"
                    />

                    {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-custom-description">Descrição</Label>

                    <Textarea
                      id="quote-custom-description"
                      name="description"
                      defaultValue={item?.description ?? ''}
                      maxLength={2000}
                      className="min-h-28 rounded-xl"
                    />

                    {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-custom-unit">Unidade *</Label>

                    <select
                      id="quote-custom-unit"
                      name="unit"
                      defaultValue={item?.unit ?? 'SERVICE'}
                      className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      {serviceUnitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-custom-value">Valor unitário *</Label>

                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>

                      <Input
                        id="quote-custom-value"
                        name="unitAmountInCents"
                        inputMode="decimal"
                        defaultValue={item ? formatBrlCurrencyInput(item.unitAmountInCents) : ''}
                        placeholder="0,00"
                        className="h-12 rounded-xl pl-11"
                      />
                    </div>

                    {fieldErrors.unitAmountInCents && (
                      <p className="text-sm text-destructive">{fieldErrors.unitAmountInCents}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="quote-item-quantity">Quantidade *</Label>

                <Input
                  id="quote-item-quantity"
                  name="quantity"
                  inputMode="decimal"
                  defaultValue={item ? formatQuantity(item.quantityInThousandths) : '1'}
                  placeholder="1"
                  className="h-12 rounded-xl"
                />

                <p className="text-xs text-muted-foreground">Você pode usar até 3 casas decimais, por exemplo: 1,5.</p>

                {fieldErrors.quantity && <p className="text-sm text-destructive">{fieldErrors.quantity}</p>}
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="cursor-pointer">
                {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}

                {item ? 'Salvar item' : 'Adicionar item'}
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
