'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatBrlCurrencyInput, formatBrlCurrencyInputValue } from '@/shared/formatters/currency.formatter';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';

import { receivablePaymentMethodOptions } from '../constants/receivable.constants';
import { receivablePaymentFormSchema } from '../schemas/receivable.schema';
import { recordReceivablePayment } from '../services/receivable.service';
import type { Receivable } from '../types/receivable.types';

interface ReceivablePaymentPanelProps {
  receivable: Receivable;
  onClose(): void;
  onSaved(receivable: Receivable): void;
}

export function ReceivablePaymentPanel({ receivable, onClose, onSaved }: ReceivablePaymentPanelProps) {
  const submittingRef = useRef(false);

  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState(formatBrlCurrencyInput(receivable.balanceInCents));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function renewRequestId(): void {
    setRequestId(crypto.randomUUID());
  }

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = receivablePaymentFormSchema.safeParse({
      amountInCents: String(data.get('amountInCents') ?? ''),
      method: String(data.get('method') ?? ''),
      receivedAt: String(data.get('receivedAt') ?? ''),
      notes: String(data.get('notes') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.');
      return;
    }

    if (parsed.data.amountInCents > receivable.balanceInCents) {
      setError('O pagamento não pode ser maior que o saldo restante.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const result = await recordReceivablePayment(
        receivable.organizationId,
        receivable.id,
        receivable.version,
        requestId,
        parsed.data,
      );

      onSaved(result.receivable);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o pagamento.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Registrar pagamento</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              O saldo atual é {formatBrlCurrencyInput(receivable.balanceInCents)}.
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
            <X className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <fieldset disabled={submitting} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Valor recebido *</Label>

                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>

                  <Input
                    id="payment-amount"
                    name="amountInCents"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      renewRequestId();
                    }}
                    onBlur={() => setAmount((value) => formatBrlCurrencyInputValue(value))}
                    className="h-12 rounded-xl pl-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Forma de pagamento *</Label>

                <select
                  id="payment-method"
                  name="method"
                  defaultValue="PIX"
                  onChange={renewRequestId}
                  className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {receivablePaymentMethodOptions.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-received-at">Recebido em *</Label>

                <Input
                  id="payment-received-at"
                  name="receivedAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocalInput(new Date())}
                  onChange={renewRequestId}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Observações</Label>

                <Textarea
                  id="payment-notes"
                  name="notes"
                  maxLength={2000}
                  onChange={renewRequestId}
                  className="min-h-28 rounded-xl"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="cursor-pointer">
                {submitting && <LoaderCircle className="size-4 animate-spin" />}
                Registrar pagamento
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
