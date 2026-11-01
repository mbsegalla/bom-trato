import { getApiConfig } from '@/config/api.config';
import { PUBLIC_DIRECTORY_PAGE_LIMIT } from '@/shared/constants/pagination.constants';

import { publicProfessionalResponseSchema, publicProfessionalsResponseSchema } from '../schemas/publicProfile.schema';
import type { PublicProfessional, PublicProfessionalPage } from '../types/publicProfile.types';

export interface PublicProfessionalsParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
}

export class PublicDirectoryError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);

    this.name = PublicDirectoryError.name;
  }
}

export async function getPublicProfessionals(params: PublicProfessionalsParams = {}): Promise<PublicProfessionalPage> {
  const { city, limit, page, search, state } = params;

  const { baseUrl } = getApiConfig();

  const query = new URLSearchParams({
    page: String(page ?? 1),
    limit: String(limit ?? PUBLIC_DIRECTORY_PAGE_LIMIT),
  });

  if (search?.trim()) {
    query.set('search', search.trim());
  }

  if (city?.trim()) {
    query.set('city', city.trim());
  }

  if (state?.trim()) {
    query.set('state', state.trim().toUpperCase());
  }

  const response = await fetch(new URL(`/api/public/professionals?${query.toString()}`, baseUrl), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new PublicDirectoryError('Não foi possível carregar os profissionais.', response.status);
  }

  const payload: unknown = await response.json();

  const parsed = publicProfessionalsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new PublicDirectoryError('Resposta inválida da vitrine.', 0);
  }

  return parsed.data;
}

export async function getPublicProfessional(slug: string): Promise<PublicProfessional> {
  const { baseUrl } = getApiConfig();

  const response = await fetch(new URL(`/api/public/professionals/${encodeURIComponent(slug)}`, baseUrl), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new PublicDirectoryError(
      response.status === 404 ? 'Profissional não encontrado.' : 'Não foi possível carregar o profissional.',
      response.status,
    );
  }

  const payload: unknown = await response.json();

  const parsed = publicProfessionalResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new PublicDirectoryError('Resposta inválida do perfil.', 0);
  }

  return parsed.data;
}

export function getPublicWhatsappUrl(slug: string): string {
  const { baseUrl } = getApiConfig();

  return new URL(`/api/public/professionals/${encodeURIComponent(slug)}/whatsapp`, baseUrl).toString();
}
