'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeLocalInput } from '@/shared/formatters/date.formatter';

import { workOrderScheduleFormSchema } from '../schemas/workOrder.schema';
import { scheduleWorkOrder } from '../services/workOrder.service';
import type { WorkOrder, WorkOrderScheduleInput } from '../types/workOrder.types';

interface WorkOrderSchedulePanelProps {
  workOrder: WorkOrder;
  onClose(): void;
  onSaved(workOrder: WorkOrder): void;
}

type FieldErrors = Partial<Record<keyof WorkOrderScheduleInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function WorkOrderSchedulePanel({ workOrder, onClose, onSaved }: WorkOrderSchedulePanelProps) {
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

    const parsed = workOrderScheduleFormSchema.safeParse({
      scheduledStartAt: String(data.get('scheduledStartAt') ?? ''),
      scheduledEndAt: String(data.get('scheduledEndAt') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        scheduledStartAt: firstError(errors.scheduledStartAt),
        scheduledEndAt: firstError(errors.scheduledEndAt),
      });

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const updated = await scheduleWorkOrder(workOrder.organizationId, workOrder.id, workOrder.version, parsed.data);

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível agendar a ordem de serviço.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              {workOrder.status === 'SCHEDULED' ? 'Reagendar serviço' : 'Agendar serviço'}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">Defina o período previsto para a execução.</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={submitting}
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <fieldset disabled={submitting} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="scheduled-start">Início *</Label>

                <Input
                  id="scheduled-start"
                  name="scheduledStartAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocalInput(workOrder.scheduledStartAt)}
                  className="h-12 rounded-xl"
                />

                {fieldErrors.scheduledStartAt && (
                  <p className="text-sm text-destructive">{fieldErrors.scheduledStartAt}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled-end">Término *</Label>

                <Input
                  id="scheduled-end"
                  name="scheduledEndAt"
                  type="datetime-local"
                  defaultValue={formatDateTimeLocalInput(workOrder.scheduledEndAt)}
                  className="h-12 rounded-xl"
                />

                {fieldErrors.scheduledEndAt && <p className="text-sm text-destructive">{fieldErrors.scheduledEndAt}</p>}
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={onClose}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submitting} className="cursor-pointer">
                {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}

                {workOrder.status === 'SCHEDULED' ? 'Salvar novo horário' : 'Confirmar agendamento'}
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
