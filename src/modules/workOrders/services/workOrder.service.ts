import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  workOrderResponseSchema,
  workOrderScheduleHistoryResponseSchema,
  workOrdersResponseSchema,
  workOrderStatusHistoryResponseSchema,
} from '../schemas/workOrder.schema';
import type {
  WorkOrder,
  WorkOrderExecutionNotesInput,
  WorkOrderListParams,
  WorkOrderPage,
  WorkOrderPlanningInput,
  WorkOrderScheduleHistoryPage,
  WorkOrderScheduleInput,
  WorkOrderStatusHistory,
} from '../types/workOrder.types';

const DEFAULT_PAGE_LIMIT = 20;

const workOrderListFlights = new Map<string, Promise<WorkOrderPage>>();
const workOrderFlights = new Map<string, Promise<WorkOrder>>();
const workOrderStatusHistoryFlights = new Map<string, Promise<WorkOrderStatusHistory[]>>();
const workOrderScheduleHistoryFlights = new Map<string, Promise<WorkOrderScheduleHistoryPage>>();

function getWorkOrderErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados informados e tente novamente.';

    case 403:
      return 'Você não tem permissão para realizar esta operação.';

    case 404:
      return 'Ordem de serviço não encontrada.';

    case 409:
      return 'A ordem de serviço foi alterada, possui um conflito de agenda ou não permite esta operação. Atualize os dados e tente novamente.';

    case 503:
      return 'As ordens de serviço estão sendo atualizadas. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

function organizationWorkOrdersPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders`;
}

async function readWorkOrder(response: Response, fallback: string): Promise<WorkOrder> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getWorkOrderErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = workOrderResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a ordem de serviço.');
  }

  return parsed.data;
}

async function requestWorkOrders(organizationId: string, params: WorkOrderListParams): Promise<WorkOrderPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit ?? DEFAULT_PAGE_LIMIT),
  });

  if (params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.customerId) {
    query.set('customerId', params.customerId);
  }

  if (params.assignedToId) {
    query.set('assignedToId', params.assignedToId);
  }

  const response = await authenticatedFetch(`${organizationWorkOrdersPath(organizationId)}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getWorkOrderErrorMessage(response.status, 'Não foi possível carregar as ordens de serviço.'));
  }

  const payload: unknown = await response.json();

  const parsed = workOrdersResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as ordens de serviço.');
  }

  return parsed.data;
}

export function listWorkOrders(organizationId: string, params: WorkOrderListParams): Promise<WorkOrderPage> {
  const key = `${organizationId}:${params.page}:${params.limit ?? DEFAULT_PAGE_LIMIT}:${params.status}:${
    params.customerId ?? ''
  }:${params.assignedToId ?? ''}`;

  const existing = workOrderListFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestWorkOrders(organizationId, params);

  workOrderListFlights.set(key, request);

  const cleanup = () => {
    if (workOrderListFlights.get(key) === request) {
      workOrderListFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function createWorkOrderFromQuote(organizationId: string, quoteId: string): Promise<WorkOrder> {
  const response = await authenticatedFetch(organizationWorkOrdersPath(organizationId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quoteId,
    }),
  });

  return readWorkOrder(response, 'Não foi possível criar a ordem de serviço.');
}

async function requestWorkOrder(organizationId: string, workOrderId: string): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}`,
  );

  return readWorkOrder(response, 'Não foi possível carregar a ordem de serviço.');
}

export function getWorkOrder(organizationId: string, workOrderId: string): Promise<WorkOrder> {
  const key = `${organizationId}:${workOrderId}`;

  const existing = workOrderFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestWorkOrder(organizationId, workOrderId);

  workOrderFlights.set(key, request);

  const cleanup = () => {
    if (workOrderFlights.get(key) === request) {
      workOrderFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function updateWorkOrder(
  organizationId: string,
  workOrderId: string,
  version: number,
  input: WorkOrderPlanningInput,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        ...input,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível atualizar a ordem de serviço.');
}

export async function assignWorkOrder(
  organizationId: string,
  workOrderId: string,
  version: number,
  assignedToId: string | null,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/assign`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        assignedToId,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível atribuir o responsável.');
}

export async function scheduleWorkOrder(
  organizationId: string,
  workOrderId: string,
  version: number,
  input: WorkOrderScheduleInput,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/schedule`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        ...input,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível agendar a ordem de serviço.');
}

export async function startWorkOrder(organizationId: string, workOrderId: string, version: number): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/start`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível iniciar a ordem de serviço.');
}

export async function updateWorkOrderExecutionNotes(
  organizationId: string,
  workOrderId: string,
  version: number,
  input: WorkOrderExecutionNotesInput,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/execution-notes`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        ...input,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível salvar as observações de execução.');
}

export async function completeWorkOrder(
  organizationId: string,
  workOrderId: string,
  version: number,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível concluir a ordem de serviço.');
}

export async function cancelWorkOrder(
  organizationId: string,
  workOrderId: string,
  version: number,
  reason: string,
): Promise<WorkOrder> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        reason,
      }),
    },
  );

  return readWorkOrder(response, 'Não foi possível cancelar a ordem de serviço.');
}

async function requestWorkOrderStatusHistory(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderStatusHistory[]> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/status-history`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getWorkOrderErrorMessage(response.status, 'Não foi possível carregar o histórico.'));
  }

  const payload: unknown = await response.json();

  const parsed = workOrderStatusHistoryResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o histórico.');
  }

  return parsed.data;
}

export function getWorkOrderStatusHistory(
  organizationId: string,
  workOrderId: string,
  version: number,
): Promise<WorkOrderStatusHistory[]> {
  const key = `${organizationId}:${workOrderId}:${version}`;

  const existing = workOrderStatusHistoryFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestWorkOrderStatusHistory(organizationId, workOrderId);

  workOrderStatusHistoryFlights.set(key, request);

  const cleanup = () => {
    if (workOrderStatusHistoryFlights.get(key) === request) {
      workOrderStatusHistoryFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestWorkOrderScheduleHistory(
  organizationId: string,
  workOrderId: string,
  page: number,
): Promise<WorkOrderScheduleHistoryPage> {
  const response = await authenticatedFetch(
    `${organizationWorkOrdersPath(organizationId)}/${encodeURIComponent(workOrderId)}/schedule-history?page=${page}&limit=10`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getWorkOrderErrorMessage(response.status, 'Não foi possível carregar o histórico de agenda.'));
  }

  const payload: unknown = await response.json();

  const parsed = workOrderScheduleHistoryResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o histórico de agenda.');
  }

  return parsed.data;
}

export function getWorkOrderScheduleHistory(
  organizationId: string,
  workOrderId: string,
  version: number,
  page: number,
): Promise<WorkOrderScheduleHistoryPage> {
  const key = `${organizationId}:${workOrderId}:${version}:${page}`;

  const existing = workOrderScheduleHistoryFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestWorkOrderScheduleHistory(organizationId, workOrderId, page);

  workOrderScheduleHistoryFlights.set(key, request);

  const cleanup = () => {
    if (workOrderScheduleHistoryFlights.get(key) === request) {
      workOrderScheduleHistoryFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
