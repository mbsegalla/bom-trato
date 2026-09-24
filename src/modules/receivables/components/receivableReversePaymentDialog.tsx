'use client';

import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { receivableReversePaymentFormSchema } from '../schemas/receivable.schema';
import { reverseReceivablePayment } from '../services/receivable.service';
import type { Receivable, ReceivablePayment } from '../types/receivable.types';

interface ReceivableReversePaymentDialogProps {
  receivable: Receivable;
  payment: ReceivablePayment;
  onClose(): void;
  onSaved(receivable: Receivable): void;
}

export function ReceivableReversePaymentDialog({
  receivable,
  payment,
  onClose,
  onSaved,
}: ReceivableReversePaymentDialogProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = receivableReversePaymentFormSchema.safeParse({
      reason: String(data.get('reason') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Informe o motivo.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const result = await reverseReceivablePayment(
        receivable.organizationId,
        receivable.id,
        payment.id,
        receivable.version,
        parsed.data.reason,
      );

      onSaved(result.receivable);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível estornar o pagamento.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-foreground/20 px-5 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="font-heading text-xl font-semibold">Estornar pagamento?</h2>

        <p className="mt-2 text-sm text-muted-foreground">O valor voltará para o saldo pendente do recebível.</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <Label htmlFor="reversal-reason">Motivo *</Label>

          <Textarea id="reversal-reason" name="reason" maxLength={1000} className="mt-2 min-h-28 rounded-xl" />

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Voltar
            </Button>

            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              Estornar pagamento
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
