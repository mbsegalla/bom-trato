import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { workOrderShareTokenSchema } from '../schemas/workOrderPortal.schema';
import {
  managementPortfolioStatusResponseSchema,
  portalPortfolioStatusResponseSchema,
  portfolioConsentFormSchema,
} from '../schemas/workOrderPortfolio.schema';
import type {
  ManagementPortfolioStatus,
  PortalPortfolioStatus,
  PortfolioConsentInput,
} from '../types/workOrderPortfolio.types';

function internalPath(organizationId: string, workOrderId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/work-orders/${encodeURIComponent(workOrderId)}/portfolio`;
}

async function assertSuccess(response: Response, fallback: string): Promise<void> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.ok) {
    return;
  }

  if (response.status === 404) {
    throw new Error('A foto, o perfil ou o link não está mais disponível.');
  }

  if (response.status === 409) {
    throw new Error('A foto não está autorizada para publicação. Atualize as informações e tente novamente.');
  }

  if (response.status === 403) {
    throw new Error('Você não tem permissão para realizar esta operação.');
  }

  throw new Error(fallback);
}

async function readManagement(response: Response): Promise<ManagementPortfolioStatus> {
  await assertSuccess(response, 'Não foi possível consultar o portfólio.');

  const payload: unknown = await response.json();
  const parsed = managementPortfolioStatusResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Resposta inválida do portfólio.');
  }

  return parsed.data;
}

async function readPortal(response: Response): Promise<PortalPortfolioStatus> {
  await assertSuccess(response, 'Não foi possível consultar as autorizações.');

  const payload: unknown = await response.json();
  const parsed = portalPortfolioStatusResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Resposta inválida das autorizações.');
  }

  return parsed.data;
}

async function publicRequest(path: string, token: string, payload: object): Promise<PortalPortfolioStatus> {
  if (!workOrderShareTokenSchema.safeParse(token).success) {
    throw new Error('O link do atendimento é inválido.');
  }

  const { baseUrl, timeoutMs } = getApiConfig();
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...payload }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  return readPortal(response);
}

export function getPortalPortfolioStatus(token: string): Promise<PortalPortfolioStatus> {
  return publicRequest('/api/public/work-orders/portfolio/status', token, {});
}

export function consentPortfolioPhotos(token: string, input: PortfolioConsentInput): Promise<PortalPortfolioStatus> {
  const parsed = portfolioConsentFormSchema.parse(input);

  return publicRequest('/api/public/work-orders/portfolio/consent', token, {
    ...parsed,
    consentVersion: '1',
  });
}

export function revokePortfolioPhoto(token: string, photoId: string): Promise<PortalPortfolioStatus> {
  return publicRequest('/api/public/work-orders/portfolio/revoke', token, { photoId });
}

export async function getManagementPortfolio(
  organizationId: string,
  workOrderId: string,
): Promise<ManagementPortfolioStatus> {
  return readManagement(await authenticatedFetch(internalPath(organizationId, workOrderId)));
}

export async function publishPortfolioPhoto(
  organizationId: string,
  workOrderId: string,
  photoId: string,
  publish: boolean,
): Promise<ManagementPortfolioStatus> {
  const response = await authenticatedFetch(
    `${internalPath(organizationId, workOrderId)}/${encodeURIComponent(photoId)}/publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish }),
    },
  );

  return readManagement(response);
}

export async function revokeManagementPortfolioConsent(
  organizationId: string,
  workOrderId: string,
  photoId: string,
): Promise<ManagementPortfolioStatus> {
  const response = await authenticatedFetch(
    `${internalPath(organizationId, workOrderId)}/${encodeURIComponent(photoId)}/revoke-consent`,
    { method: 'POST' },
  );

  return readManagement(response);
}

export async function getProfessionalPortfolioImage(slug: string, photoId: string): Promise<Blob> {
  const { baseUrl, timeoutMs } = getApiConfig();
  const response = await fetch(
    new URL(
      `/api/public/professionals/${encodeURIComponent(slug)}/portfolio/${encodeURIComponent(photoId)}/content`,
      baseUrl,
    ),
    {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'image/webp' },
      signal: AbortSignal.timeout(timeoutMs),
    },
  );

  await assertSuccess(response, 'Não foi possível carregar esta foto do portfólio.');

  const blob = await response.blob();

  if (blob.type !== 'image/webp' || blob.size === 0 || blob.size > 10 * 1024 * 1024) {
    throw new Error('A imagem recebida é inválida.');
  }

  return blob;
}
