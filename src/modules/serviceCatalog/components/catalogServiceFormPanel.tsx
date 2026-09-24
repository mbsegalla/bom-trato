'use client';

import { Banknote, LoaderCircle, StickyNote, Tag, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrlCurrencyInput } from '@/shared/formatters/currency.formatter';

import { serviceUnitOptions } from '../constants/catalogService.constants';
import { catalogServiceFormSchema } from '../schemas/catalogService.schema';
import { createCatalogService, updateCatalogService } from '../services/catalogService.service';
import type { CatalogService, CatalogServiceInput } from '../types/catalogService.types';

interface CatalogServiceFormPanelProps {
  organizationId: string;
  service?: CatalogService;
  onClose(): void;
  onSaved(): void;
}

type CatalogServiceFieldErrors = Partial<Record<keyof CatalogServiceInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function CatalogServiceFormPanel({ organizationId, service, onClose, onSaved }: CatalogServiceFormPanelProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CatalogServiceFieldErrors>({});

  const editing = service !== undefined;

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const parsed = catalogServiceFormSchema.safeParse({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      unit: String(formData.get('unit') ?? ''),
      amountInCents: String(formData.get('amountInCents') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        name: firstError(errors.name),
        description: firstError(errors.description),
        unit: firstError(errors.unit),
        amountInCents: firstError(errors.amountInCents),
      });

      return;
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (editing) {
        await updateCatalogService(organizationId, service.id, parsed.data);
      } else {
        await createCatalogService(organizationId, parsed.data);
      }

      onSaved();
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o serviço.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-service-form-title"
        className="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border bg-background shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="catalog-service-form-title" className="font-heading text-2xl font-semibold tracking-tight">
              {editing ? 'Editar serviço' : 'Novo serviço'}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {editing
                ? 'Atualize as informações usadas nos próximos orçamentos.'
                : 'Cadastre um serviço para reutilizar nos seus orçamentos.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar"
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
              <div className="space-y-2">
                <Label htmlFor="catalog-service-name">Nome *</Label>

                <div className="relative">
                  <Tag
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    id="catalog-service-name"
                    name="name"
                    defaultValue={service?.name ?? ''}
                    autoFocus
                    maxLength={100}
                    placeholder="Ex.: Instalação elétrica"
                    aria-invalid={fieldErrors.name ? true : undefined}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.name && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog-service-description">Descrição</Label>

                <div className="relative">
                  <StickyNote
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground"
                  />

                  <Textarea
                    id="catalog-service-description"
                    name="description"
                    defaultValue={service?.description ?? ''}
                    maxLength={2000}
                    placeholder="Descreva o que está incluído neste serviço."
                    aria-invalid={fieldErrors.description ? true : undefined}
                    className="min-h-32 rounded-xl pl-11"
                  />
                </div>

                <div className="flex justify-between gap-4">
                  {fieldErrors.description ? (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}

                  <span className="text-xs text-muted-foreground">Máximo de 2000 caracteres</span>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="catalog-service-unit">Unidade *</Label>

                  <select
                    id="catalog-service-unit"
                    name="unit"
                    defaultValue={service?.unit ?? 'SERVICE'}
                    aria-invalid={fieldErrors.unit ? true : undefined}
                    className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                  >
                    {serviceUnitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.unit && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catalog-service-amount">Valor *</Label>

                  <div className="relative">
                    <Banknote
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                    />

                    <Input
                      id="catalog-service-amount"
                      name="amountInCents"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      defaultValue={service === undefined ? '' : formatBrlCurrencyInput(service.amountInCents)}
                      placeholder="0,00"
                      aria-invalid={fieldErrors.amountInCents ? true : undefined}
                      className="h-12 rounded-xl pl-11"
                    />
                  </div>

                  {fieldErrors.amountInCents && (
                    <p role="alert" className="text-sm text-destructive">
                      {fieldErrors.amountInCents}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="min-h-11 cursor-pointer rounded-xl px-5"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="min-h-11 cursor-pointer rounded-xl px-5">
                {submitting ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    Salvando...
                  </>
                ) : editing ? (
                  'Salvar alterações'
                ) : (
                  'Cadastrar serviço'
                )}
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
