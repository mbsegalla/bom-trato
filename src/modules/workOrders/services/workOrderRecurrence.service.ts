import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { DEFAULT_PAGE_LIMIT } from '@/shared/constants/pagination.constants';

import {
  workOrderRecurrenceFormSchema,
  workOrderRecurrenceResponseSchema,
  workOrderRecurrencesResponseSchema,
} from '../schemas/workOrderRecurrence.schema';
import type {
  WorkOrderRecurrenceInput,
  WorkOrderRecurrenceList,
  WorkOrderRecurrenceListParams,
  WorkOrderRecurrenceView,
} from '../types/workOrderRecurrence.types';

function recurrencePath(organizationId: string, workOrderId: string): string {
  const ordersPath = `/api/organizations/${encodeURIComponent(organizationId)}/work-orders`;

  return `${ordersPath}/${encodeURIComponent(workOrderId)}/recurrence`;
}

async function readRecurrence(response: Response): Promise<WorkOrderRecurrenceView> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Confira a frequência e a data da próxima visita.');

      case 403:
        throw new Error('Você não possui permissão para configurar a recorrência.');

      case 404:
        throw new Error('Ordem de serviço não encontrada.');

      case 409:
        throw new Error('A configuração foi alterada ou o serviço não permite recorrência. Atualize os dados.');

      case 503:
        throw new Error('A recorrência está indisponível. Tente novamente em instantes.');

      default:
        throw new Error('Não foi possível consultar ou salvar a recorrência.');
    }
  }

  const payload: unknown = await response.json();
  const parsed = workOrderRecurrenceResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados da recorrência.');
  }

  return parsed.data;
}

export async function getWorkOrderRecurrence(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderRecurrenceView> {
  const response = await authenticatedFetch(recurrencePath(organizationId, workOrderId));

  return readRecurrence(response);
}

export async function saveWorkOrderRecurrence(
  organizationId: string,
  workOrderId: string,
  version: number,
  input: WorkOrderRecurrenceInput,
): Promise<WorkOrderRecurrenceView> {
  const parsed = workOrderRecurrenceFormSchema.parse(input);
  const response = await authenticatedFetch(recurrencePath(organizationId, workOrderId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...parsed, version }),
  });

  return readRecurrence(response);
}

export async function listWorkOrderRecurrences(
  organizationId: string,
  params: WorkOrderRecurrenceListParams,
): Promise<WorkOrderRecurrenceList> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit ?? DEFAULT_PAGE_LIMIT),
  });

  if (params.status !== 'ALL') {
    query.set('status', params.status);
  }

  if (params.visit !== 'ALL') {
    query.set('visit', params.visit);
  }

  if (params.customerName.trim()) {
    query.set('customerName', params.customerName.trim());
  }

  const path = `/api/organizations/${encodeURIComponent(organizationId)}/work-order-recurrences`;
  const response = await authenticatedFetch(`${path}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'Você não possui permissão para consultar as recorrências.'
        : 'Não foi possível carregar os serviços recorrentes.',
    );
  }

  const payload: unknown = await response.json();
  const parsed = workOrderRecurrencesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os serviços recorrentes.');
  }

  return parsed.data;
}
