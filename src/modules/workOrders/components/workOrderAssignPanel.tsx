'use client';

import { LoaderCircle, UserRound, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { OrganizationMember } from '@/modules/organizations/types/organization.types';

import { assignWorkOrder } from '../services/workOrder.service';
import type { WorkOrder } from '../types/workOrder.types';

interface WorkOrderAssignPanelProps {
  workOrder: WorkOrder;
  members: OrganizationMember[];
  onClose(): void;
  onSaved(workOrder: WorkOrder): void;
}

export function WorkOrderAssignPanel({ workOrder, members, onClose, onSaved }: WorkOrderAssignPanelProps) {
  const submittingRef = useRef(false);

  const [assignedToId, setAssignedToId] = useState(workOrder.assignedToId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduled = workOrder.status === 'SCHEDULED';

  async function handleSubmit(): Promise<void> {
    if (submittingRef.current) {
      return;
    }

    if (scheduled && assignedToId.length === 0) {
      setError('Uma ordem agendada precisa ter um responsável.');

      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await assignWorkOrder(
        workOrder.organizationId,
        workOrder.id,
        workOrder.version,
        assignedToId || null,
      );

      onSaved(updated);
      onClose();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atribuir o responsável.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <section className="flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Responsável</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Escolha quem ficará responsável pela execução do serviço.
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

        <div className="flex-1 px-6 py-6">
          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <UserRound aria-hidden="true" className="size-5 text-primary" />

              <div className="flex-1">
                <label htmlFor="work-order-assignee" className="text-sm font-medium">
                  Responsável
                </label>

                <select
                  id="work-order-assignee"
                  value={assignedToId}
                  onChange={(event) => setAssignedToId(event.target.value)}
                  className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {!scheduled && <option value="">Sem responsável</option>}

                  {members.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-border px-6 py-5">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose} className="cursor-pointer">
            Cancelar
          </Button>

          <Button type="button" disabled={submitting} onClick={() => void handleSubmit()} className="cursor-pointer">
            {submitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            Salvar responsável
          </Button>
        </footer>
      </section>
    </div>
  );
}
