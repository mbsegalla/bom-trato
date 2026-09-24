'use client';

import { LoaderCircle, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { workOrderPlanningFormSchema } from '../schemas/workOrder.schema';
import { updateWorkOrder } from '../services/workOrder.service';
import type { WorkOrder, WorkOrderPlanningInput } from '../types/workOrder.types';

interface WorkOrderPlanningPanelProps {
  workOrder: WorkOrder;
  onClose(): void;
  onSaved(workOrder: WorkOrder): void;
}

type FieldErrors = Partial<Record<keyof WorkOrderPlanningInput, string>>;

function firstError(errors: string[] | undefined): string | undefined {
  return errors?.[0];
}

export function WorkOrderPlanningPanel({ workOrder, onClose, onSaved }: WorkOrderPlanningPanelProps) {
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

    const parsed = workOrderPlanningFormSchema.safeParse({
      title: String(data.get('title') ?? ''),
      instructions: String(data.get('instructions') ?? ''),
      serviceAddress: String(data.get('serviceAddress') ?? ''),
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        title: firstError(errors.title),
        instructions: firstError(errors.instructions),
        serviceAddress: firstError(errors.serviceAddress),
      });

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const updated = await updateWorkOrder(workOrder.organizationId, workOrder.id, workOrder.version, parsed.data);

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a ordem de serviço.');
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
            <h2 className="font-heading text-2xl font-semibold">Planejamento</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste o título, instruções e o endereço onde o serviço será realizado.
            </p>
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
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="work-order-title">Título *</Label>

                <Input
                  id="work-order-title"
                  name="title"
                  defaultValue={workOrder.title}
                  maxLength={150}
                  className="h-12 rounded-xl"
                />

                {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-order-address">Endereço do serviço</Label>

                <Textarea
                  id="work-order-address"
                  name="serviceAddress"
                  defaultValue={workOrder.serviceAddress ?? ''}
                  maxLength={500}
                  className="min-h-24 rounded-xl"
                  placeholder="Rua, número, complemento, bairro e cidade"
                />

                {fieldErrors.serviceAddress && <p className="text-sm text-destructive">{fieldErrors.serviceAddress}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-order-instructions">Instruções</Label>

                <Textarea
                  id="work-order-instructions"
                  name="instructions"
                  defaultValue={workOrder.instructions ?? ''}
                  maxLength={5000}
                  className="min-h-36 rounded-xl"
                />

                {fieldErrors.instructions && <p className="text-sm text-destructive">{fieldErrors.instructions}</p>}
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
                Salvar planejamento
              </Button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
