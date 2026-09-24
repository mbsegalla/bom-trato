'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDateInput } from '@/shared/formatters/date.formatter';

import { updateReceivableFormSchema } from '../schemas/receivable.schema';
import { updateReceivable } from '../services/receivable.service';
import type { Receivable } from '../types/receivable.types';

interface ReceivableEditPanelProps {
  receivable: Receivable;
  onClose(): void;
  onSaved(receivable: Receivable): void;
}

export function ReceivableEditPanel({ receivable, onClose, onSaved }: ReceivableEditPanelProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = updateReceivableFormSchema.safeParse({
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
      const updated = await updateReceivable(receivable.organizationId, receivable.id, receivable.version, parsed.data);

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o recebível.');
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
            <h2 className="font-heading text-2xl font-semibold">Editar recebível</h2>
            <p className="mt-1 text-sm text-muted-foreground">Atualize o vencimento ou as observações.</p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose} disabled={submitting}>
            <X className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <fieldset disabled={submitting} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="receivable-due-at">Vencimento *</Label>

                <Input
                  id="receivable-due-at"
                  name="dueAt"
                  type="date"
                  defaultValue={formatDateInput(receivable.dueAt)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivable-notes">Observações</Label>

                <Textarea
                  id="receivable-notes"
                  name="notes"
                  maxLength={2000}
                  defaultValue={receivable.notes ?? ''}
                  className="min-h-36 rounded-xl"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting && <LoaderCircle className="size-4 animate-spin" />}
                Salvar alterações
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
