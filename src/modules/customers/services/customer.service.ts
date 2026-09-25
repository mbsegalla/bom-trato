import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { customerOverviewSchema, customerResponseSchema, customersResponseSchema } from '../schemas/customer.schema';
import type {
  Customer,
  CustomerFormInput,
  CustomerListParams,
  CustomerOverview,
  CustomerPage,
} from '../types/customer.types';

const DEFAULT_PAGE_LIMIT = 5;

const customerListFlights = new Map<string, Promise<CustomerPage>>();
const customerOverviewFlights = new Map<string, Promise<CustomerOverview>>();

function getCustomerErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados informados e tente novamente.';

    case 403:
      return 'Você não tem permissão para realizar esta operação.';

    case 404:
      return 'Cliente não encontrado.';

    case 409:
      return 'Este cliente não pode ser alterado no estado atual.';

    case 503:
      return 'Os clientes estão sendo atualizados. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

function organizationCustomersPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/customers`;
}

async function readCustomer(response: Response, fallback: string): Promise<Customer> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (response.status === 409) {
    throw new SessionError('Já existe um cliente com este e-mail.', 409);
  }

  if (!response.ok) {
    throw new Error(getCustomerErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = customerResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do cliente.');
  }

  return parsed.data;
}

async function requestCustomers(organizationId: string, params: CustomerListParams): Promise<CustomerPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit ?? DEFAULT_PAGE_LIMIT),
    status: params.status,
  });

  const search = params.search?.trim();

  if (search) {
    query.set('search', search);
  }

  const response = await authenticatedFetch(`${organizationCustomersPath(organizationId)}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getCustomerErrorMessage(response.status, 'Não foi possível carregar seus clientes.'));
  }

  const payload: unknown = await response.json();

  const parsed = customersResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a lista de clientes.');
  }

  return parsed.data;
}

export function listCustomers(organizationId: string, params: CustomerListParams): Promise<CustomerPage> {
  const key = `${organizationId}:${params.page}:${params.limit ?? DEFAULT_PAGE_LIMIT}:${params.status}:${
    params.search?.trim() ?? ''
  }`;

  const existing = customerListFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestCustomers(organizationId, params);

  customerListFlights.set(key, request);

  const cleanup = () => {
    if (customerListFlights.get(key) === request) {
      customerListFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function createCustomer(organizationId: string, input: CustomerFormInput): Promise<Customer> {
  const response = await authenticatedFetch(organizationCustomersPath(organizationId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readCustomer(response, 'Não foi possível cadastrar o cliente.');
}

export async function updateCustomer(
  organizationId: string,
  customerId: string,
  input: CustomerFormInput,
): Promise<Customer> {
  const response = await authenticatedFetch(
    `${organizationCustomersPath(organizationId)}/${encodeURIComponent(customerId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  return readCustomer(response, 'Não foi possível atualizar o cliente.');
}

export async function archiveCustomer(organizationId: string, customerId: string): Promise<Customer> {
  const response = await authenticatedFetch(
    `${organizationCustomersPath(organizationId)}/${encodeURIComponent(customerId)}/archive`,
    {
      method: 'POST',
    },
  );

  return readCustomer(response, 'Não foi possível arquivar o cliente.');
}

export async function restoreCustomer(organizationId: string, customerId: string): Promise<Customer> {
  const response = await authenticatedFetch(
    `${organizationCustomersPath(organizationId)}/${encodeURIComponent(customerId)}/restore`,
    {
      method: 'POST',
    },
  );

  return readCustomer(response, 'Não foi possível restaurar o cliente.');
}

async function requestCustomerOverview(organizationId: string, customerId: string): Promise<CustomerOverview> {
  const response = await authenticatedFetch(
    `${organizationCustomersPath(organizationId)}/${encodeURIComponent(customerId)}/overview`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getCustomerErrorMessage(response.status, 'Não foi possível carregar o cliente.'));
  }

  const payload: unknown = await response.json();

  const parsed = customerOverviewSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a visão geral do cliente.');
  }

  return parsed.data;
}

export function getCustomerOverview(organizationId: string, customerId: string): Promise<CustomerOverview> {
  const key = `${organizationId}:${customerId}`;

  const existing = customerOverviewFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestCustomerOverview(organizationId, customerId);

  customerOverviewFlights.set(key, request);

  const cleanup = () => {
    if (customerOverviewFlights.get(key) === request) {
      customerOverviewFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
