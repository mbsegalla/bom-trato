import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  publicWorkOrderResponseSchema,
  workOrderShareResponseSchema,
  workOrderShareStatusResponseSchema,
  workOrderShareTokenSchema,
} from '../schemas/workOrderPortal.schema';
import type {
  PublicWorkOrder,
  WorkOrderShare,
  WorkOrderShareDuration,
  WorkOrderShareStatus,
} from '../types/workOrderPortal.types';

const DAY_MS = 24 * 60 * 60 * 1000;

export class PublicWorkOrderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);

    this.name = 'PublicWorkOrderError';
  }
}

function workOrderSharePath(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/share`;
}

function getShareErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira o prazo de validade e tente novamente.';

    case 402:
      return 'É necessário possuir acesso ativo para gerar um compartilhamento.';

    case 403:
      return 'Você não possui permissão para realizar esta operação.';

    case 404:
      return 'Ordem de serviço não encontrada.';

    case 409:
      return 'Os dados foram alterados. Atualize a ordem de serviço e tente novamente.';

    case 503:
      return 'O serviço está temporariamente indisponível. Tente novamente.';

    default:
      return fallback;
  }
}

function assertShareResponse(response: Response, fallback: string): void {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getShareErrorMessage(response.status, fallback));
  }
}

export async function getWorkOrderShare(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderShareStatus | null> {
  const response = await authenticatedFetch(workOrderSharePath(organizationId, workOrderId));

  assertShareResponse(response, 'Não foi possível consultar o compartilhamento.');

  const payload: unknown = await response.json();

  const parsed = workOrderShareStatusResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o compartilhamento.');
  }

  return parsed.data;
}

export async function createWorkOrderShare(
  organizationId: string,
  workOrderId: string,
  version: number,
  duration: WorkOrderShareDuration,
): Promise<WorkOrderShare> {
  const expiresAt = new Date(Date.now() + duration * DAY_MS).toISOString();

  const response = await authenticatedFetch(workOrderSharePath(organizationId, workOrderId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      expiresAt,
    }),
  });

  assertShareResponse(response, 'Não foi possível gerar o link de acompanhamento.');

  const payload: unknown = await response.json();

  const parsed = workOrderShareResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o link gerado.');
  }

  return parsed.data;
}

export async function revokeWorkOrderShare(organizationId: string, workOrderId: string): Promise<void> {
  const response = await authenticatedFetch(workOrderSharePath(organizationId, workOrderId), {
    method: 'DELETE',
  });

  assertShareResponse(response, 'Não foi possível revogar o compartilhamento.');
}

export async function resolvePublicWorkOrder(token: string): Promise<PublicWorkOrder> {
  if (!workOrderShareTokenSchema.safeParse(token).success) {
    throw new PublicWorkOrderError('O link de acompanhamento é inválido ou está incompleto.', false);
  }

  const { baseUrl, timeoutMs } = getApiConfig();

  const response = await fetch(new URL('/api/public/work-orders/resolve', baseUrl), {
    method: 'POST',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status === 400 || response.status === 404) {
    throw new PublicWorkOrderError(
      'Este link não está mais disponível. Solicite um novo link ao profissional responsável.',
      false,
    );
  }

  if (response.status === 429) {
    throw new PublicWorkOrderError(
      'Muitas consultas foram realizadas. Aguarde alguns instantes e tente novamente.',
      true,
    );
  }

  if (!response.ok) {
    throw new PublicWorkOrderError('Não foi possível consultar seu atendimento no momento.', true);
  }

  const payload: unknown = await response.json();

  const parsed = publicWorkOrderResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new PublicWorkOrderError('Não foi possível interpretar as informações do atendimento.', true);
  }

  return parsed.data;
}
