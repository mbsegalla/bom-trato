import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { businessProfileResponseSchema } from '../schemas/business.schema';
import type { BusinessProfile, BusinessProfileInput } from '../types/business.types';

const businessProfileFlights = new Map<string, Promise<BusinessProfile>>();

function profilePath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/profile`;
}

function getBusinessErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados do negócio e tente novamente.';

    case 403:
      return 'Somente o administrador do negócio pode alterar estes dados.';

    case 404:
      return 'Negócio não encontrado.';

    case 503:
      return 'O negócio está sendo atualizado. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

async function requestBusinessProfile(organizationId: string): Promise<BusinessProfile> {
  const response = await authenticatedFetch(profilePath(organizationId));

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getBusinessErrorMessage(response.status, 'Não foi possível carregar os dados do negócio.'));
  }

  const payload: unknown = await response.json();

  const parsed = businessProfileResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do negócio.');
  }

  return parsed.data;
}

export function getBusinessProfile(organizationId: string): Promise<BusinessProfile> {
  const existing = businessProfileFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestBusinessProfile(organizationId);

  businessProfileFlights.set(organizationId, request);

  const cleanup = () => {
    if (businessProfileFlights.get(organizationId) === request) {
      businessProfileFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function updateBusinessProfile(
  organizationId: string,
  input: BusinessProfileInput,
): Promise<BusinessProfile> {
  const response = await authenticatedFetch(profilePath(organizationId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getBusinessErrorMessage(response.status, 'Não foi possível salvar os dados do negócio.'));
  }

  const payload: unknown = await response.json();

  const parsed = businessProfileResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados atualizados do negócio.');
  }

  return parsed.data;
}
