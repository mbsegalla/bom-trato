import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { joinedOrganizationsResponseSchema, organizationMembersResponseSchema } from '../schemas/organization.schema';
import type { JoinedOrganization, OrganizationMember } from '../types/organization.types';

const PAGE_LIMIT = 100;
const ORGANIZATION_MEMBERS_CACHE_TTL_MS = 5 * 60 * 1000;

interface OrganizationMembersCacheEntry {
  items: OrganizationMember[];
  expiresAt: number;
}

let joinedOrganizationsFlight: Promise<JoinedOrganization[]> | null = null;

const organizationMembersCache = new Map<string, OrganizationMembersCacheEntry>();
const organizationMembersFlights = new Map<string, Promise<OrganizationMember[]>>();

async function requestJoinedOrganizations(): Promise<JoinedOrganization[]> {
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

export function listJoinedOrganizations(): Promise<JoinedOrganization[]> {
  if (joinedOrganizationsFlight) {
    return joinedOrganizationsFlight;
  }

  const request = requestJoinedOrganizations();

  joinedOrganizationsFlight = request;

  const cleanup = () => {
    if (joinedOrganizationsFlight === request) {
      joinedOrganizationsFlight = null;
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function requestOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const members: OrganizationMember[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await authenticatedFetch(
      `/api/organizations/${encodeURIComponent(organizationId)}/members?page=${page}&limit=${PAGE_LIMIT}`,
    );

    if (response.status === 401) {
      throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
    }

    if (!response.ok) {
      throw new Error('Não foi possível carregar os membros do negócio.');
    }

    const payload: unknown = await response.json();

    const parsed = organizationMembersResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new Error('Não foi possível interpretar os membros do negócio.');
    }

    members.push(...parsed.data.items);

    hasMore = parsed.data.hasMore;
    page += 1;
  }

  return members;
}

export function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const cached = organizationMembersCache.get(organizationId);

  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.items);
  }

  if (cached) {
    organizationMembersCache.delete(organizationId);
  }

  const existing = organizationMembersFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestOrganizationMembers(organizationId).then((items) => {
    organizationMembersCache.set(organizationId, {
      items,
      expiresAt: Date.now() + ORGANIZATION_MEMBERS_CACHE_TTL_MS,
    });

    return items;
  });

  organizationMembersFlights.set(organizationId, request);

  const cleanup = () => {
    if (organizationMembersFlights.get(organizationId) === request) {
      organizationMembersFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export function invalidateOrganizationMembers(organizationId: string): void {
  organizationMembersCache.delete(organizationId);
}
