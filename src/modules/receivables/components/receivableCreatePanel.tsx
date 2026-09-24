'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateInput } from '@/shared/formatters/date.formatter';

import { createReceivableFormSchema } from '../schemas/receivable.schema';
import { createReceivableFromWorkOrder } from '../services/receivable.service';
import type { Receivable } from '../types/receivable.types';

interface ReceivableCreatePanelProps {
  organizationId: string;
  workOrderId: string;
  title: string;
  onClose(): void;
  onCreated(receivable: Receivable): void;
}

export function ReceivableCreatePanel({
  organizationId,
  workOrderId,
  title,
  onClose,
  onCreated,
}: ReceivableCreatePanelProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultDueAt] = useState(() => formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = createReceivableFormSchema.safeParse({
      dueAt: String(data.get('dueAt') ?? ''),
      notes: String(data.get('notes') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Confira os dados informados.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const receivable = await createReceivableFromWorkOrder(organizationId, workOrderId, parsed.data);

      onCreated(receivable);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar o recebível.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-xl">
        <header className="flex justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Criar recebível</h2>

            <p className="mt-1 text-sm text-muted-foreground">{title}</p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <fieldset disabled={submitting} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="create-receivable-due">Vencimento *</Label>

                <Input
                  id="create-receivable-due"
                  name="dueAt"
                  type="date"
                  defaultValue={defaultDueAt}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-receivable-notes">Observações</Label>

                <Textarea id="create-receivable-notes" name="notes" maxLength={2000} className="min-h-32 rounded-xl" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="size-4 animate-spin" />}
                Criar recebível
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
