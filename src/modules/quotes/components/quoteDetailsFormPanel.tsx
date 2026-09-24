'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrlCurrencyInput } from '@/shared/formatters/currency.formatter';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';

import { updateQuoteFormSchema } from '../schemas/quote.schema';
import { updateQuote } from '../services/quote.service';
import type { Quote, UpdateQuoteInput } from '../types/quote.types';

interface QuoteDetailsFormPanelProps {
  quote: Quote;
  onClose(): void;
  onSaved(quote: Quote): void;
}

type FieldErrors = Partial<Record<keyof UpdateQuoteInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function QuoteDetailsFormPanel({ quote, onClose, onSaved }: QuoteDetailsFormPanelProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = updateQuoteFormSchema.safeParse({
      title: String(data.get('title') ?? ''),
      notes: String(data.get('notes') ?? ''),
      validUntil: String(data.get('validUntil') ?? ''),
      discountInCents: String(data.get('discountInCents') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        title: firstError(errors.title),
        notes: firstError(errors.notes),
        validUntil: firstError(errors.validUntil),
        discountInCents: firstError(errors.discountInCents),
      });

      return;
    }

    if (parsed.data.discountInCents > quote.subtotalInCents) {
      setFieldErrors({
        discountInCents: 'O desconto não pode ser maior que o subtotal.',
      });

      return;
    }

    submittingRef.current = true;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const updated = await updateQuote(quote.organizationId, quote.id, quote.version, parsed.data);

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o orçamento.');
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
            <h2 className="font-heading text-2xl font-semibold">Editar orçamento</h2>

            <p className="mt-1 text-sm text-muted-foreground">Atualize as informações do rascunho.</p>
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
              <div className="space-y-2">
                <Label htmlFor="edit-quote-title">Título *</Label>

                <Input
                  id="edit-quote-title"
                  name="title"
                  defaultValue={quote.title}
                  maxLength={150}
                  className="h-12 rounded-xl"
                />

                {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quote-valid-until">Validade</Label>

                <Input
                  id="edit-quote-valid-until"
                  name="validUntil"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocalInput(quote.validUntil)}
                  className="h-12 rounded-xl"
                />

                {fieldErrors.validUntil && <p className="text-sm text-destructive">{fieldErrors.validUntil}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quote-discount">Desconto</Label>

                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>

                  <Input
                    id="edit-quote-discount"
                    name="discountInCents"
                    inputMode="decimal"
                    defaultValue={formatBrlCurrencyInput(quote.discountInCents)}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>

                {fieldErrors.discountInCents && (
                  <p className="text-sm text-destructive">{fieldErrors.discountInCents}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quote-notes">Observações</Label>

                <Textarea
                  id="edit-quote-notes"
                  name="notes"
                  defaultValue={quote.notes ?? ''}
                  maxLength={5000}
                  className="min-h-36 rounded-xl"
                />

                {fieldErrors.notes && <p className="text-sm text-destructive">{fieldErrors.notes}</p>}
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
                Salvar alterações
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
