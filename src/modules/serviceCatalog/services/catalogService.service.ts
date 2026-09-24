import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { catalogServiceResponseSchema, catalogServicesResponseSchema } from '../schemas/catalogService.schema';
import type {
  CatalogService,
  CatalogServiceInput,
  CatalogServiceListParams,
  CatalogServicePage,
} from '../types/catalogService.types';

const DEFAULT_PAGE_LIMIT = 20;

const catalogServiceListFlights = new Map<string, Promise<CatalogServicePage>>();
const catalogServiceFlights = new Map<string, Promise<CatalogService>>();

function getCatalogServiceErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados informados e tente novamente.';

    case 403:
      return 'Você não tem permissão para realizar esta operação.';

    case 404:
      return 'Serviço não encontrado.';

    case 409:
      return 'Este serviço não pode ser alterado no estado atual.';

    case 503:
      return 'O catálogo está sendo atualizado. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

function organizationServicesPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/services`;
}

async function readCatalogService(response: Response, fallback: string): Promise<CatalogService> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getCatalogServiceErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = catalogServiceResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do serviço.');
  }

  return parsed.data;
}

async function requestCatalogServices(
  organizationId: string,
  params: CatalogServiceListParams,
): Promise<CatalogServicePage> {
  const { page, limit, status, search: searchQuery } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit ?? DEFAULT_PAGE_LIMIT),
    status,
  });

  const search = searchQuery?.trim();

  if (search) {
    query.set('search', search);
  }

  const response = await authenticatedFetch(`${organizationServicesPath(organizationId)}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getCatalogServiceErrorMessage(response.status, 'Não foi possível carregar seu catálogo.'));
  }

  const payload: unknown = await response.json();

  const parsed = catalogServicesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o catálogo de serviços.');
  }

  return parsed.data;
}

export function listCatalogServices(
  organizationId: string,
  params: CatalogServiceListParams,
): Promise<CatalogServicePage> {
  const { page, limit, status, search } = params;

  const key = `${organizationId}:${page}:${limit ?? DEFAULT_PAGE_LIMIT}:${status}:${search?.trim() ?? ''}`;

  const existing = catalogServiceListFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestCatalogServices(organizationId, params);

  catalogServiceListFlights.set(key, request);

  const cleanup = () => {
    if (catalogServiceListFlights.get(key) === request) {
      catalogServiceListFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function createCatalogService(
  organizationId: string,
  input: CatalogServiceInput,
): Promise<CatalogService> {
  const response = await authenticatedFetch(organizationServicesPath(organizationId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readCatalogService(response, 'Não foi possível cadastrar o serviço.');
}

async function requestCatalogService(organizationId: string, serviceId: string): Promise<CatalogService> {
  const response = await authenticatedFetch(
    `${organizationServicesPath(organizationId)}/${encodeURIComponent(serviceId)}`,
  );

  return readCatalogService(response, 'Não foi possível carregar o serviço.');
}

export function getCatalogService(organizationId: string, serviceId: string): Promise<CatalogService> {
  const key = `${organizationId}:${serviceId}`;

  const existing = catalogServiceFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestCatalogService(organizationId, serviceId);

  catalogServiceFlights.set(key, request);

  const cleanup = () => {
    if (catalogServiceFlights.get(key) === request) {
      catalogServiceFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function updateCatalogService(
  organizationId: string,
  serviceId: string,
  input: CatalogServiceInput,
): Promise<CatalogService> {
  const response = await authenticatedFetch(
    `${organizationServicesPath(organizationId)}/${encodeURIComponent(serviceId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  return readCatalogService(response, 'Não foi possível atualizar o serviço.');
}

export async function archiveCatalogService(organizationId: string, serviceId: string): Promise<CatalogService> {
  const response = await authenticatedFetch(
    `${organizationServicesPath(organizationId)}/${encodeURIComponent(serviceId)}/archive`,
    {
      method: 'POST',
    },
  );

  return readCatalogService(response, 'Não foi possível arquivar o serviço.');
}

export async function restoreCatalogService(organizationId: string, serviceId: string): Promise<CatalogService> {
  const response = await authenticatedFetch(
    `${organizationServicesPath(organizationId)}/${encodeURIComponent(serviceId)}/restore`,
    {
      method: 'POST',
    },
  );

  return readCatalogService(response, 'Não foi possível restaurar o serviço.');
}
