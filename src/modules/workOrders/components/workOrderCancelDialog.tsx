'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { workOrderCancelFormSchema } from '../schemas/workOrder.schema';
import { cancelWorkOrder } from '../services/workOrder.service';
import type { WorkOrder } from '../types/workOrder.types';

interface WorkOrderCancelDialogProps {
  workOrder: WorkOrder;
  onClose(): void;
  onCanceled(workOrder: WorkOrder): void;
}

export function WorkOrderCancelDialog({ workOrder, onClose, onCanceled }: WorkOrderCancelDialogProps) {
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const data = new FormData(event.currentTarget);

    const parsed = workOrderCancelFormSchema.safeParse({
      reason: String(data.get('reason') ?? ''),
    });

    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.reason?.[0] ?? 'Informe o motivo do cancelamento.');

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await cancelWorkOrder(
        workOrder.organizationId,
        workOrder.id,
        workOrder.version,
        parsed.data.reason,
      );

      onCanceled(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar a ordem de serviço.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-foreground/20 px-5 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Cancelar ordem de serviço?</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Informe o motivo. Ele ficará registrado no histórico da ordem.
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
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-2">
            <Label htmlFor="cancel-work-order-reason">Motivo *</Label>

            <Textarea
              id="cancel-work-order-reason"
              name="reason"
              maxLength={1000}
              className="min-h-28 rounded-xl"
              placeholder="Explique por que esta ordem está sendo cancelada."
            />
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={onClose} className="cursor-pointer">
              Voltar
            </Button>

            <Button type="submit" variant="destructive" disabled={submitting} className="cursor-pointer">
              {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              Cancelar ordem
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
