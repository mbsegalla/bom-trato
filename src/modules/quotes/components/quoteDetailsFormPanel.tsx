'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/datePicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrlCurrencyInput } from '@/shared/formatters/currency.formatter';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';

import { getQuotePaymentConditionDescription, quotePaymentConditionOptions } from '../constants/quote.constants';
import { updateQuoteFormSchema } from '../schemas/quote.schema';
import { updateQuote } from '../services/quote.service';
import type { Quote, QuotePaymentCondition, UpdateQuoteInput } from '../types/quote.types';

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

  const [paymentCondition, setPaymentCondition] = useState<QuotePaymentCondition>(quote.paymentCondition);
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(String(quote.downPaymentPercentage ?? 30));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const downPaymentPercentageNumber = Number(downPaymentPercentage);

  const downPaymentPercentagePreview =
    Number.isSafeInteger(downPaymentPercentageNumber) &&
    downPaymentPercentageNumber >= 1 &&
    downPaymentPercentageNumber <= 99
      ? downPaymentPercentageNumber
      : null;

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
      paymentCondition: String(data.get('paymentCondition') ?? quote.paymentCondition),
      downPaymentPercentage: String(data.get('downPaymentPercentage') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        title: firstError(errors.title),
        notes: firstError(errors.notes),
        validUntil: firstError(errors.validUntil),
        discountInCents: firstError(errors.discountInCents),
        paymentCondition: firstError(errors.paymentCondition),
        downPaymentPercentage: firstError(errors.downPaymentPercentage),
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

      toast.success('Orçamento atualizado com sucesso.');

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível atualizar o orçamento.';

      setError(message);
      toast.error(message);
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

                <DateTimePicker
                  id="edit-quote-valid-until"
                  name="validUntil"
                  defaultValue={formatDateTimeLocalInput(quote.validUntil)}
                  minuteStep={15}
                  clearable
                  ariaInvalid={Boolean(fieldErrors.validUntil)}
                  placeholder="Selecione a validade"
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

              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quote-payment-condition">Condição de pagamento</Label>

                  <select
                    id="edit-quote-payment-condition"
                    name="paymentCondition"
                    value={paymentCondition}
                    onChange={(event) => {
                      const next = event.currentTarget.value as QuotePaymentCondition;

                      setPaymentCondition(next);

                      if (next === 'DOWN_PAYMENT_AND_BALANCE' && downPaymentPercentage.length === 0) {
                        setDownPaymentPercentage('30');
                      }
                    }}
                    className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {quotePaymentConditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {fieldErrors.paymentCondition && (
                    <p className="text-sm text-destructive">{fieldErrors.paymentCondition}</p>
                  )}
                </div>

                {paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-quote-down-payment-percentage">Entrada</Label>

                    <div className="relative">
                      <Input
                        id="edit-quote-down-payment-percentage"
                        name="downPaymentPercentage"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={99}
                        value={downPaymentPercentage}
                        onChange={(event) => setDownPaymentPercentage(event.currentTarget.value)}
                        className="h-12 rounded-xl pr-12"
                      />

                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        %
                      </span>
                    </div>

                    {fieldErrors.downPaymentPercentage && (
                      <p className="text-sm text-destructive">{fieldErrors.downPaymentPercentage}</p>
                    )}
                  </div>
                )}

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {getQuotePaymentConditionDescription(
                    paymentCondition,
                    paymentCondition === 'DOWN_PAYMENT_AND_BALANCE' ? downPaymentPercentagePreview : null,
                  )}
                </p>
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
