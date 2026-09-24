'use client';

import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { receivableCancelFormSchema } from '../schemas/receivable.schema';
import { cancelReceivable } from '../services/receivable.service';
import type { Receivable } from '../types/receivable.types';

interface ReceivableCancelDialogProps {
  receivable: Receivable;
  onClose(): void;
  onSaved(receivable: Receivable): void;
}

export function ReceivableCancelDialog({ receivable, onClose, onSaved }: ReceivableCancelDialogProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    const parsed = receivableCancelFormSchema.safeParse({
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
      const updated = await cancelReceivable(
        receivable.organizationId,
        receivable.id,
        receivable.version,
        parsed.data.reason,
      );

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar o recebível.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-foreground/20 px-5 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="font-heading text-xl font-semibold">Cancelar recebível?</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Somente recebíveis sem pagamentos ativos podem ser cancelados.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <Label htmlFor="receivable-cancel-reason">Motivo *</Label>

          <Textarea id="receivable-cancel-reason" name="reason" maxLength={1000} className="mt-2 min-h-28 rounded-xl" />

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Voltar
            </Button>

            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting && <LoaderCircle className="size-4 animate-spin" />}
              Cancelar recebível
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
