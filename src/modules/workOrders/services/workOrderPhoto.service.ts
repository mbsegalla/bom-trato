import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { WORK_ORDER_PHOTO_MAX_SIZE, WORK_ORDER_PHOTO_MIME_TYPES } from '../constants/workOrderPhoto.constants';
import { workOrderPhotoResponseSchema, workOrderPhotosResponseSchema } from '../schemas/workOrderPhoto.schema';
import { workOrderShareTokenSchema } from '../schemas/workOrderPortal.schema';
import type { WorkOrderPhoto, WorkOrderPhotoInput } from '../types/workOrderPhoto.types';
import { PublicWorkOrderError } from './workOrderPortal.service';

function photosPath(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/photos`;
}

async function assertPhotoResponse(response: Response, fallback: string): Promise<void> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.ok) {
    return;
  }

  if (response.status === 409) {
    const payload: unknown = await response.json().catch(() => null);

    const code =
      typeof payload === 'object' && payload !== null && 'error' in payload ? Reflect.get(payload, 'error') : null;

    if (typeof code === 'object' && code !== null && Reflect.get(code, 'code') === 'WORK_ORDER_PHOTO_LIMIT_REACHED') {
      throw new Error('Esta ordem de serviço já possui 20 fotos. Remova uma foto antes de enviar outra.');
    }

    throw new Error('Esta foto foi alterada. Atualize as fotos antes de tentar novamente.');
  }

  const messages: Record<number, string> = {
    400: 'Confira a etapa, a legenda e o arquivo. Use uma foto JPEG, PNG ou WebP válida.',
    402: 'É necessário possuir acesso ativo para adicionar ou compartilhar fotos.',
    403: 'Você não possui permissão para realizar esta operação.',
    404: 'A foto ou a ordem de serviço não está mais disponível. Atualize as fotos.',
    413: 'A foto deve ter no máximo 10 MB.',
    415: 'Use uma foto JPEG, PNG ou WebP.',
    429: 'Muitas solicitações foram realizadas. Aguarde alguns instantes e tente novamente.',
    503: 'O serviço de fotos está temporariamente indisponível. Tente novamente.',
  };

  throw new Error(messages[response.status] ?? fallback);
}

async function readPhoto(response: Response, fallback: string): Promise<WorkOrderPhoto> {
  await assertPhotoResponse(response, fallback);

  const payload: unknown = await response.json();
  const parsed = workOrderPhotoResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados da foto.');
  }

  return parsed.data;
}

async function readPhotoContent(response: Response): Promise<Blob> {
  const blob = await response.blob();

  if (blob.type !== 'image/webp' || blob.size === 0 || blob.size > WORK_ORDER_PHOTO_MAX_SIZE) {
    throw new Error('Não foi possível interpretar o conteúdo da foto.');
  }

  return blob;
}

export function validateWorkOrderPhotoFile(file: File): string | null {
  if (!WORK_ORDER_PHOTO_MIME_TYPES.includes(file.type)) {
    return 'Use uma foto JPEG, PNG ou WebP.';
  }

  if (file.size === 0 || file.size > WORK_ORDER_PHOTO_MAX_SIZE) {
    return 'Escolha uma foto de até 10 MB.';
  }

  return null;
}

export async function listWorkOrderPhotos(organizationId: string, workOrderId: string): Promise<WorkOrderPhoto[]> {
  const response = await authenticatedFetch(photosPath(organizationId, workOrderId));

  await assertPhotoResponse(response, 'Não foi possível carregar as fotos.');

  const payload: unknown = await response.json();
  const parsed = workOrderPhotosResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as fotos da ordem de serviço.');
  }

  return parsed.data;
}

export async function uploadWorkOrderPhoto(
  organizationId: string,
  workOrderId: string,
  file: File,
  input: WorkOrderPhotoInput,
): Promise<WorkOrderPhoto> {
  const error = validateWorkOrderPhotoFile(file);

  if (error) {
    throw new Error(error);
  }

  const body = new FormData();

  body.append('file', file);
  body.append('stage', input.stage);

  if (input.caption !== null) {
    body.append('caption', input.caption);
  }

  const response = await authenticatedFetch(photosPath(organizationId, workOrderId), { method: 'POST', body });

  return readPhoto(response, 'Não foi possível enviar a foto.');
}

export async function updateWorkOrderPhoto(
  organizationId: string,
  workOrderId: string,
  photo: WorkOrderPhoto,
  input: WorkOrderPhotoInput,
): Promise<WorkOrderPhoto> {
  const unchangedDetails = input.stage === photo.stage && input.caption === photo.caption;
  const changes = unchangedDetails ? { visibleInPortal: input.visibleInPortal } : input;

  const response = await authenticatedFetch(
    `${photosPath(organizationId, workOrderId)}/${encodeURIComponent(photo.id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: photo.version, ...changes }),
    },
  );

  return readPhoto(response, 'Não foi possível atualizar a foto.');
}

export async function deleteWorkOrderPhoto(
  organizationId: string,
  workOrderId: string,
  photo: WorkOrderPhoto,
): Promise<void> {
  const response = await authenticatedFetch(
    `${photosPath(organizationId, workOrderId)}/${encodeURIComponent(photo.id)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: photo.version }),
    },
  );

  await assertPhotoResponse(response, 'Não foi possível remover a foto.');
}

export async function getWorkOrderPhotoContent(
  organizationId: string,
  workOrderId: string,
  photoId: string,
): Promise<Blob> {
  const response = await authenticatedFetch(
    `${photosPath(organizationId, workOrderId)}/${encodeURIComponent(photoId)}/content`,
    { headers: { Accept: 'image/webp' }, redirect: 'error', referrerPolicy: 'no-referrer' },
  );

  await assertPhotoResponse(response, 'Não foi possível carregar esta foto.');

  return readPhotoContent(response);
}

export async function getPublicWorkOrderPhotoContent(token: string, photoId: string): Promise<Blob> {
  if (!workOrderShareTokenSchema.safeParse(token).success) {
    throw new PublicWorkOrderError('O link de acompanhamento é inválido ou está incompleto.', false);
  }

  const { baseUrl, timeoutMs } = getApiConfig();

  const response = await fetch(
    new URL(`/api/public/work-orders/photos/${encodeURIComponent(photoId)}/content`, baseUrl),
    {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', Accept: 'image/webp' },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );

  if (response.status === 400 || response.status === 404) {
    throw new PublicWorkOrderError('Esta foto não está mais disponível neste link.', false);
  }

  if (!response.ok) {
    throw new PublicWorkOrderError('Não foi possível carregar esta foto. Tente novamente em instantes.', true);
  }

  return readPhotoContent(response);
}
