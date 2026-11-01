import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { DEFAULT_PAGE_LIMIT } from '@/shared/constants/pagination.constants';

import { convertLeadResponseSchema, leadResponseSchema, leadsResponseSchema } from '../schemas/lead.schema';
import type { ConvertLeadResult, Lead, LeadListParams, LeadPage } from '../types/lead.types';

const listFlights = new Map<string, Promise<LeadPage>>();

function path(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/leads`;
}

function errorMessage(status: number): string {
  switch (status) {
    case 403:
      return 'Você não tem permissão para acessar esta oportunidade.';
    case 404:
      return 'Oportunidade não encontrada.';
    case 409:
      return 'Esta oportunidade não pode ser alterada no estado atual.';
    case 503:
      return 'As oportunidades estão sendo atualizadas. Tente novamente em instantes.';
    default:
      return 'Não foi possível realizar esta operação.';
  }
}

async function check(response: Response): Promise<Response> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(errorMessage(response.status));
  }

  return response;
}

function leadListRequestKey(organizationId: string, params: LeadListParams): string {
  return JSON.stringify({
    organizationId,
    page: params.page,
    limit: params.limit ?? DEFAULT_PAGE_LIMIT,
    status: params.status ?? null,
    search: params.search?.trim() || null,
  });
}

async function requestLeads(organizationId: string, params: LeadListParams): Promise<LeadPage> {
  const { page, limit, status, search } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit ?? DEFAULT_PAGE_LIMIT),
  });

  if (status) {
    query.set('status', status);
  }

  if (search?.trim()) {
    query.set('search', search.trim());
  }

  const response = await check(await authenticatedFetch(`${path(organizationId)}?${query.toString()}`));

  const payload: unknown = await response.json();
  const parsed = leadsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar as oportunidades.');
  }

  return parsed.data;
}

export function listLeads(organizationId: string, params: LeadListParams): Promise<LeadPage> {
  const key = leadListRequestKey(organizationId, params);
  const current = listFlights.get(key);

  if (current) {
    return current;
  }

  const request = requestLeads(organizationId, params);

  listFlights.set(key, request);

  const cleanup = () => {
    if (listFlights.get(key) === request) {
      listFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function getLead(organizationId: string, leadId: string): Promise<Lead> {
  const response = await check(await authenticatedFetch(`${path(organizationId)}/${encodeURIComponent(leadId)}`));

  const payload: unknown = await response.json();
  const parsed = leadResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a oportunidade.');
  }

  return parsed.data;
}

async function leadAction(organizationId: string, leadId: string, action: string): Promise<Lead> {
  const response = await check(
    await authenticatedFetch(`${path(organizationId)}/${encodeURIComponent(leadId)}/${action}`, {
      method: 'POST',
    }),
  );

  const payload: unknown = await response.json();
  const parsed = leadResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a oportunidade.');
  }

  return parsed.data;
}

export function markLeadContacted(organizationId: string, leadId: string): Promise<Lead> {
  return leadAction(organizationId, leadId, 'contacted');
}

export function archiveLead(organizationId: string, leadId: string): Promise<Lead> {
  return leadAction(organizationId, leadId, 'archive');
}

export async function convertLead(organizationId: string, leadId: string): Promise<ConvertLeadResult> {
  const response = await check(
    await authenticatedFetch(`${path(organizationId)}/${encodeURIComponent(leadId)}/convert`, {
      method: 'POST',
    }),
  );

  const payload: unknown = await response.json();
  const parsed = convertLeadResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a conversão da oportunidade.');
  }

  return parsed.data;
}
