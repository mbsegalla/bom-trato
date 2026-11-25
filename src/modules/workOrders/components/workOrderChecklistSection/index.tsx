'use client';

import { ClipboardList, ListChecks, LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmationDialog';
import { SessionError } from '@/modules/auth/services/session.service';

import { WORK_ORDER_CHECKLIST_LIMIT } from '../../constants/workOrderChecklist.constants';
import {
  createWorkOrderChecklistItem,
  deleteWorkOrderChecklistItem,
  getWorkOrderChecklist,
  reorderWorkOrderChecklist,
  updateWorkOrderChecklistItem,
  WorkOrderChecklistError,
} from '../../services/workOrderChecklist.service';
import type {
  WorkOrderChecklist,
  WorkOrderChecklistInput,
  WorkOrderChecklistItem,
  WorkOrderChecklistUpdateInput,
} from '../../types/workOrderChecklist.types';
import { WorkOrderChecklistProgress } from '../workOrderChecklistProgress';
import { WorkOrderChecklistForm } from './components/workOrderChecklistForm';
import { WorkOrderChecklistItemRow } from './components/workOrderChecklistItemRow';

interface WorkOrderChecklistSectionProps {
  organizationId: string;
  workOrderId: string;
}

type ChecklistState =
  { kind: 'loading' } | { kind: 'ready'; checklist: WorkOrderChecklist } | { kind: 'error'; message: string };

type ChecklistFormState = { kind: 'create' } | { kind: 'edit'; item: WorkOrderChecklistItem };

function checklistWithItems(items: WorkOrderChecklistItem[]): WorkOrderChecklist {
  return {
    items,
    progress: { total: items.length, completed: items.filter((item) => item.completed).length },
  };
}

export function WorkOrderChecklistSection({ organizationId, workOrderId }: WorkOrderChecklistSectionProps) {
  return (
    <OrganizationWorkOrderChecklist
      key={`${organizationId}:${workOrderId}`}
      organizationId={organizationId}
      workOrderId={workOrderId}
    />
  );
}

function OrganizationWorkOrderChecklist({ organizationId, workOrderId }: WorkOrderChecklistSectionProps) {
  const router = useRouter();
  const activeRef = useRef(true);
  const pendingRef = useRef(false);
  const refreshRequiredRef = useRef(false);
  const [state, setState] = useState<ChecklistState>({ kind: 'loading' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [form, setForm] = useState<ChecklistFormState | null>(null);
  const [removal, setRemoval] = useState<WorkOrderChecklistItem | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void getWorkOrderChecklist(organizationId, workOrderId)
      .then((checklist) => {
        if (active) {
          refreshRequiredRef.current = false;
          setRefreshRequired(false);
          setState({ kind: 'ready', checklist });
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof SessionError && cause.status === 401) {
          router.replace('/login');

          return;
        }

        setState({
          kind: 'error',
          message: cause instanceof Error ? cause.message : 'Não foi possível carregar o checklist.',
        });
      });

    return () => {
      active = false;
    };
  }, [organizationId, refreshVersion, router, workOrderId]);

  function refresh(): void {
    if (pendingRef.current) {
      return;
    }

    setForm(null);
    setRemoval(null);
    setActionError(null);
    setState({ kind: 'loading' });
    setRefreshVersion((value) => value + 1);
  }

  async function mutate(
    operation: (checklist: WorkOrderChecklist) => Promise<WorkOrderChecklist>,
    successMessage: string,
  ): Promise<void> {
    if (pendingRef.current || refreshRequiredRef.current || state.kind !== 'ready') {
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setActionError(null);

    try {
      const checklist = await operation(state.checklist);

      if (!activeRef.current) {
        return;
      }

      setState({ kind: 'ready', checklist });
      setForm(null);
      setRemoval(null);
      toast.success(successMessage);
    } catch (cause: unknown) {
      if (!activeRef.current) {
        return;
      }

      if (cause instanceof SessionError && cause.status === 401) {
        router.replace('/login');

        return;
      }

      setRemoval(null);
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível salvar a alteração no checklist.');

      if (cause instanceof WorkOrderChecklistError && cause.refreshRequired) {
        refreshRequiredRef.current = true;
        setRefreshRequired(true);
        setForm(null);
      }
    } finally {
      pendingRef.current = false;

      if (activeRef.current) {
        setPending(false);
      }
    }
  }

  async function save(input: WorkOrderChecklistInput): Promise<void> {
    if (form === null) {
      return;
    }

    await mutate(
      async (checklist) => {
        const item =
          form.kind === 'create'
            ? await createWorkOrderChecklistItem(organizationId, workOrderId, input)
            : await updateWorkOrderChecklistItem(organizationId, workOrderId, form.item, input);

        return checklistWithItems(
          form.kind === 'create'
            ? [...checklist.items, item]
            : checklist.items.map((current) => (current.id === item.id ? item : current)),
        );
      },
      form.kind === 'create' ? 'Item adicionado como privado.' : 'Item atualizado com sucesso.',
    );
  }

  async function update(
    item: WorkOrderChecklistItem,
    input: WorkOrderChecklistUpdateInput,
    message: string,
  ): Promise<void> {
    await mutate(async (checklist) => {
      const updated = await updateWorkOrderChecklistItem(organizationId, workOrderId, item, input);

      return checklistWithItems(checklist.items.map((current) => (current.id === updated.id ? updated : current)));
    }, message);
  }

  async function remove(): Promise<void> {
    if (removal === null) {
      return;
    }

    await mutate(async (checklist) => {
      await deleteWorkOrderChecklistItem(organizationId, workOrderId, removal);

      return checklistWithItems(checklist.items.filter((item) => item.id !== removal.id));
    }, 'Item removido do checklist.');
  }

  async function move(item: WorkOrderChecklistItem, direction: -1 | 1): Promise<void> {
    if (state.kind !== 'ready') {
      return;
    }

    const index = state.checklist.items.findIndex((current) => current.id === item.id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= state.checklist.items.length) {
      return;
    }

    await mutate(async (checklist) => {
      const items = [...checklist.items];

      [items[index], items[target]] = [items[target], items[index]];

      return reorderWorkOrderChecklist(organizationId, workOrderId, items);
    }, 'Ordem do checklist atualizada.');
  }

  const items = state.kind === 'ready' ? state.checklist.items : [];
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;

  return (
    <section aria-busy={pending || state.kind === 'loading'} className="border-t border-border pt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-3">
            <ListChecks aria-hidden="true" className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Checklist de execução</h2>
          </div>

          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Organize as etapas deste serviço e acompanhe o que já foi concluído.
          </p>

          {state.kind === 'ready' && (
            <p className="mt-2 text-xs text-muted-foreground">
              {total} de {WORK_ORDER_CHECKLIST_LIMIT} itens · Novos itens são privados
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending || state.kind === 'loading'}
            onClick={refresh}
            className="min-h-11 cursor-pointer"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Atualizar checklist
          </Button>

          <Button
            type="button"
            disabled={
              pending ||
              refreshRequired ||
              state.kind !== 'ready' ||
              total >= WORK_ORDER_CHECKLIST_LIMIT ||
              form !== null
            }
            onClick={() => {
              setActionError(null);
              setForm({ kind: 'create' });
            }}
            className="min-h-11 cursor-pointer"
          >
            <Plus aria-hidden="true" className="size-4" />
            Adicionar item
          </Button>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {actionError}

          {refreshRequired && (
            <span className="mt-2 block font-medium">
              Use “Atualizar checklist” para conferir os dados e liberar novas alterações.
            </span>
          )}
        </p>
      )}

      {form && (
        <WorkOrderChecklistForm
          key={form.kind === 'edit' ? `${form.item.id}:${form.item.version}` : 'create'}
          item={form.kind === 'edit' ? form.item : null}
          saving={pending}
          onCancel={() => setForm(null)}
          onSave={save}
        />
      )}

      {state.kind === 'loading' ? (
        <div role="status" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-muted/30 p-10">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando checklist...</span>
        </div>
      ) : state.kind === 'error' ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : total === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
          <ClipboardList aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhum item no checklist</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adicione as verificações e os cuidados necessários para este serviço.
          </p>
        </div>
      ) : (
        <>
          <WorkOrderChecklistProgress total={total} completed={completed} label="Progresso do checklist de execução" />

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Marque os itens concluídos e escolha quais o cliente poderá acompanhar no portal.
          </p>

          <ul className="mt-5 space-y-3">
            {items.map((item, index) => (
              <WorkOrderChecklistItemRow
                key={item.id}
                item={item}
                first={index === 0}
                last={index === total - 1}
                disabled={pending || refreshRequired || form !== null || removal !== null}
                onToggleCompleted={() =>
                  void update(
                    item,
                    { completed: !item.completed },
                    item.completed ? 'Item reaberto.' : 'Item concluído.',
                  )
                }
                onToggleVisibility={() =>
                  void update(
                    item,
                    { visibleInPortal: !item.visibleInPortal },
                    item.visibleInPortal ? 'Item ocultado do portal do cliente.' : 'Item visível no portal do cliente.',
                  )
                }
                onEdit={() => {
                  setActionError(null);
                  setForm({ kind: 'edit', item });
                }}
                onRemove={() => setRemoval(item)}
                onMove={(direction) => void move(item, direction)}
              />
            ))}
          </ul>
        </>
      )}

      {pending && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Salvando checklist...
        </p>
      )}

      {removal && (
        <ConfirmationDialog
          title="Remover item do checklist?"
          description="Este item será removido desta ordem de serviço e do portal do cliente. Esta ação não pode ser desfeita."
          confirmLabel="Remover item"
          destructive
          loading={pending}
          onCancel={() => setRemoval(null)}
          onConfirm={() => void remove()}
        />
      )}
    </section>
  );
}
