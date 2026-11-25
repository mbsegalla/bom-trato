import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  publicWorkOrderAcceptanceReceiptResponseSchema,
  workOrderAcceptanceFormSchema,
  workOrderAcceptanceSnapshotHashSchema,
  workOrderAcceptanceStatusResponseSchema,
} from '../schemas/workOrderAcceptance.schema';
import { workOrderShareTokenSchema } from '../schemas/workOrderPortal.schema';
import type {
  PublicWorkOrderAcceptanceReceipt,
  WorkOrderAcceptanceInput,
  WorkOrderAcceptanceStatus,
} from '../types/workOrderAcceptance.types';

const UNCERTAIN_ACCEPTANCE_MESSAGE =
  'Não foi possível confirmar se o aceite foi registrado. Atualize o atendimento para consultar o resultado antes de tentar novamente.';

export class PublicWorkOrderAcceptanceError extends Error {
  constructor(
    message: string,
    readonly refreshRequired = false,
  ) {
    super(message);

    this.name = 'PublicWorkOrderAcceptanceError';
  }
}

export async function getWorkOrderAcceptance(
  organizationId: string,
  workOrderId: string,
): Promise<WorkOrderAcceptanceStatus> {
  const path = `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/acceptance`;

  const response = await authenticatedFetch(path);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      403: 'Você não possui permissão para consultar este aceite.',
      404: 'A ordem de serviço não está mais disponível.',
      429: 'Muitas consultas foram realizadas. Aguarde alguns instantes e tente novamente.',
    };

    throw new Error(messages[response.status] ?? 'Não foi possível consultar o aceite da conclusão.');
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = workOrderAcceptanceStatusResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o aceite da conclusão.');
  }

  return parsed.data;
}

export async function acceptPublicWorkOrder(
  token: string,
  snapshotHash: string,
  consentVersion: string,
  input: WorkOrderAcceptanceInput,
): Promise<PublicWorkOrderAcceptanceReceipt> {
  if (
    !workOrderShareTokenSchema.safeParse(token).success ||
    !workOrderAcceptanceSnapshotHashSchema.safeParse(snapshotHash).success
  ) {
    throw new PublicWorkOrderAcceptanceError('Atualize o atendimento antes de registrar seu aceite.', true);
  }

  const parsedInput = workOrderAcceptanceFormSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new PublicWorkOrderAcceptanceError(parsedInput.error.issues[0]?.message ?? 'Confira os dados do aceite.');
  }

  const { baseUrl, timeoutMs } = getApiConfig();
  let response: Response;

  try {
    response = await fetch(new URL('/api/public/work-orders/acceptance', baseUrl), {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, snapshotHash, consentVersion, ...parsedInput.data }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new PublicWorkOrderAcceptanceError(UNCERTAIN_ACCEPTANCE_MESSAGE, true);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 409) {
    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload ? Reflect.get(payload, 'error') : null;

    const code = typeof error === 'object' && error !== null ? Reflect.get(error, 'code') : null;

    const message =
      code === 'WORK_ORDER_ALREADY_ACCEPTED'
        ? 'Este atendimento já possui um aceite. Atualize o atendimento para consultar o registro.'
        : code === 'WORK_ORDER_ACCEPTANCE_NOT_AVAILABLE'
          ? 'O aceite da conclusão não está disponível neste momento. Atualize o atendimento antes de continuar.'
          : 'As informações do atendimento mudaram. Atualize e confira os serviços antes de confirmar novamente.';

    throw new PublicWorkOrderAcceptanceError(message, true);
  }

  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Confira seu nome e a confirmação da conclusão antes de tentar novamente.',
      403: 'O aceite da conclusão não está disponível neste momento. Atualize o atendimento ou fale com o profissional.',
      404: 'Este link não está mais disponível. Atualize o atendimento ou solicite um novo link ao profissional.',
      429: 'Muitas solicitações foram realizadas. Aguarde alguns instantes e tente novamente.',
    };

    throw new PublicWorkOrderAcceptanceError(
      messages[response.status] ?? UNCERTAIN_ACCEPTANCE_MESSAGE,
      response.status !== 400 && response.status !== 429,
    );
  }

  const parsed = publicWorkOrderAcceptanceReceiptResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new PublicWorkOrderAcceptanceError(UNCERTAIN_ACCEPTANCE_MESSAGE, true);
  }

  return parsed.data;
}
