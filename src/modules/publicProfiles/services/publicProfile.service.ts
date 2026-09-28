import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { publicProfileSettingsResponseSchema } from '../schemas/publicProfile.schema';
import type { PublicProfileInput, PublicProfileSettings } from '../types/publicProfile.types';

function path(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/public-profile`;
}

async function parse(response: Response): Promise<PublicProfileSettings> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);

    const code =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'object' &&
      payload.error !== null &&
      'code' in payload.error &&
      typeof payload.error.code === 'string'
        ? payload.error.code
        : null;

    if (code === 'PUBLIC_PROFILE_SLUG_TAKEN') {
      throw new Error('Esta URL já está sendo utilizada por outro profissional.');
    }

    if (code === 'PUBLIC_PROFILE_LOCATION_REQUIRED') {
      throw new Error('Informe cidade e estado nos dados do negócio antes de publicar sua vitrine.');
    }

    throw new Error('Não foi possível salvar sua vitrine.');
  }

  const payload: unknown = await response.json();

  const parsed = publicProfileSettingsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados da vitrine.');
  }

  return parsed.data;
}

export async function getPublicProfileSettings(organizationId: string): Promise<PublicProfileSettings> {
  const response = await authenticatedFetch(path(organizationId));

  return parse(response);
}

export async function updatePublicProfile(
  organizationId: string,
  input: PublicProfileInput,
): Promise<PublicProfileSettings> {
  const response = await authenticatedFetch(path(organizationId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return parse(response);
}
