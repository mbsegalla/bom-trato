import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { joinedOrganizationsResponseSchema } from '../schemas/organization.schema';
import type { JoinedOrganization } from '../types/organization.types';

const PAGE_LIMIT = 100;

export async function listJoinedOrganizations(): Promise<JoinedOrganization[]> {
  const organizations: JoinedOrganization[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await authenticatedFetch(`/api/organizations/mine?page=${page}&limit=${PAGE_LIMIT}`);

    if (response.status === 401) {
      throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
    }

    if (!response.ok) {
      throw new Error('Não foi possível carregar seus negócios.');
    }

    const payload: unknown = await response.json();

    const parsed = joinedOrganizationsResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error('Não foi possível interpretar seus negócios.');
    }

    organizations.push(...parsed.data.items);

    hasMore = parsed.data.hasMore;
    page += 1;
  }

  return organizations;
}
