'use client';

import { LoaderCircle, Save, StickyNote } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { workOrderExecutionNotesFormSchema } from '../schemas/workOrder.schema';
import { updateWorkOrderExecutionNotes } from '../services/workOrder.service';
import type { WorkOrder } from '../types/workOrder.types';

interface WorkOrderExecutionNotesProps {
  workOrder: WorkOrder;
  onSaved(workOrder: WorkOrder): void;
}

export function WorkOrderExecutionNotes({ workOrder, onSaved }: WorkOrderExecutionNotesProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editable = workOrder.status !== 'COMPLETED' && workOrder.status !== 'CANCELED';

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (!editable || submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = workOrderExecutionNotesFormSchema.safeParse({
      executionNotes: String(data.get('executionNotes') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.executionNotes?.[0] ?? 'Confira as observações.');

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateWorkOrderExecutionNotes(
        workOrder.organizationId,
        workOrder.id,
        workOrder.version,
        parsed.data,
      );

      onSaved(updated);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as observações.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <StickyNote aria-hidden="true" className="size-5 text-primary" />

        <h2 className="font-heading text-lg font-semibold">Observações da execução</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <Textarea
          name="executionNotes"
          defaultValue={workOrder.executionNotes ?? ''}
          readOnly={!editable}
          maxLength={10000}
          className="min-h-36 rounded-xl"
          placeholder="Registre informações importantes durante a execução do serviço."
        />

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {editable && (
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={submitting} className="cursor-pointer">
              {submitting ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              Salvar observações
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
