import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  workOrderChecklistItemResponseSchema,
  workOrderChecklistResponseSchema,
} from '../schemas/workOrderChecklist.schema';
import type {
  WorkOrderChecklist,
  WorkOrderChecklistInput,
  WorkOrderChecklistItem,
  WorkOrderChecklistUpdateInput,
} from '../types/workOrderChecklist.types';

export class WorkOrderChecklistError extends Error {
  constructor(
    message: string,
    readonly refreshRequired = false,
  ) {
    super(message);

    this.name = 'WorkOrderChecklistError';
  }
}

function checklistPath(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/checklist`;
}

async function assertChecklistResponse(response: Response, fallback: string): Promise<void> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.ok) {
    return;
  }

  if (response.status === 409) {
    const payload: unknown = await response.json().catch(() => null);

    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload ? Reflect.get(payload, 'error') : null;

    if (
      typeof error === 'object' &&
      error !== null &&
      Reflect.get(error, 'code') === 'WORK_ORDER_CHECKLIST_LIMIT_REACHED'
    ) {
      throw new WorkOrderChecklistError(
        'Esta ordem de serviço já possui 50 itens no checklist. Remova um item antes de adicionar outro.',
        true,
      );
    }

    throw new WorkOrderChecklistError(
      'O checklist foi alterado em outra sessão. Sua alteração não foi salva. Atualize o checklist antes de tentar novamente.',
      true,
    );
  }

  const messages: Record<number, string> = {
    400: 'Confira o título e os dados do item antes de tentar novamente.',
    402: 'É necessário possuir acesso ativo para adicionar, alterar ou compartilhar itens do checklist.',
    403: 'Você não possui permissão para realizar esta operação.',
    404: 'O item ou a ordem de serviço não está mais disponível. Atualize o checklist.',
    429: 'Muitas solicitações foram realizadas. Aguarde alguns instantes e tente novamente.',
  };

  throw new WorkOrderChecklistError(
    messages[response.status] ?? fallback,
    response.status === 404 || response.status >= 500,
  );
}

async function requestChecklistMutation(path: string, init: RequestInit): Promise<Response> {
  try {
    return await authenticatedFetch(path, init);
  } catch (cause: unknown) {
    if (cause instanceof SessionError && cause.status === 401) {
      throw cause;
    }

    throw new WorkOrderChecklistError(
      'Não foi possível confirmar a alteração. Atualize o checklist antes de tentar novamente.',
      true,
    );
  }
}

async function readChecklistItem(response: Response, fallback: string): Promise<WorkOrderChecklistItem> {
  await assertChecklistResponse(response, fallback);

  const payload: unknown = await response.json().catch(() => null);
  const parsed = workOrderChecklistItemResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new WorkOrderChecklistError(
      'Não foi possível confirmar os dados do item. Atualize o checklist antes de tentar novamente.',
      true,
    );
  }

  return parsed.data;
}

async function readChecklist(response: Response, fallback: string): Promise<WorkOrderChecklist> {
  await assertChecklistResponse(response, fallback);

  const payload: unknown = await response.json().catch(() => null);
  const parsed = workOrderChecklistResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new WorkOrderChecklistError('Não foi possível interpretar o checklist. Atualize os itens.', true);
  }

  return parsed.data;
}

export async function getWorkOrderChecklist(organizationId: string, workOrderId: string): Promise<WorkOrderChecklist> {
  const response = await authenticatedFetch(checklistPath(organizationId, workOrderId));

  return readChecklist(response, 'Não foi possível carregar o checklist.');
}

export async function createWorkOrderChecklistItem(
  organizationId: string,
  workOrderId: string,
  input: WorkOrderChecklistInput,
): Promise<WorkOrderChecklistItem> {
  const response = await requestChecklistMutation(checklistPath(organizationId, workOrderId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readChecklistItem(response, 'Não foi possível adicionar o item.');
}

export async function updateWorkOrderChecklistItem(
  organizationId: string,
  workOrderId: string,
  item: WorkOrderChecklistItem,
  input: WorkOrderChecklistUpdateInput,
): Promise<WorkOrderChecklistItem> {
  const response = await requestChecklistMutation(
    `${checklistPath(organizationId, workOrderId)}/${encodeURIComponent(item.id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: item.version, ...input }),
    },
  );

  return readChecklistItem(response, 'Não foi possível atualizar o item.');
}

export async function deleteWorkOrderChecklistItem(
  organizationId: string,
  workOrderId: string,
  item: WorkOrderChecklistItem,
): Promise<void> {
  const response = await requestChecklistMutation(
    `${checklistPath(organizationId, workOrderId)}/${encodeURIComponent(item.id)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: item.version }),
    },
  );

  await assertChecklistResponse(response, 'Não foi possível remover o item.');
}

export async function reorderWorkOrderChecklist(
  organizationId: string,
  workOrderId: string,
  items: WorkOrderChecklistItem[],
): Promise<WorkOrderChecklist> {
  const response = await requestChecklistMutation(`${checklistPath(organizationId, workOrderId)}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: items.map(({ id, version }) => ({ id, version })) }),
  });

  return readChecklist(response, 'Não foi possível reordenar o checklist.');
}
