import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  receivableFinancialSchema,
  receivablePaymentResultResponseSchema,
  receivablePaymentsResponseSchema,
  receivableResponseSchema,
  receivablesResponseSchema,
} from '../schemas/receivable.schema';
import type {
  CreateReceivableInput,
  Receivable,
  ReceivableFinancial,
  ReceivableListParams,
  ReceivablePage,
  ReceivablePaymentInput,
  ReceivablePaymentResult,
  ReceivablePaymentsPage,
  UpdateReceivableInput,
} from '../types/receivable.types';

const DEFAULT_PAGE_LIMIT = 20;
const PAYMENT_PAGE_LIMIT = 10;

const receivableListFlights = new Map<string, Promise<ReceivablePage>>();
const receivableFlights = new Map<string, Promise<Receivable>>();
const paymentFlights = new Map<string, Promise<ReceivablePaymentsPage>>();
const financialFlights = new Map<string, Promise<ReceivableFinancial>>();

function receivablesPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/receivables`;
}

function getReceivableErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados informados e tente novamente.';

    case 403:
      return 'Você não tem permissão para realizar esta operação.';

    case 404:
      return 'Recebível não encontrado.';

    case 409:
      return 'O recebível foi alterado ou não permite esta operação. Atualize os dados e tente novamente.';

    case 503:
      return 'Os recebíveis estão sendo atualizados. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

async function readReceivable(response: Response, fallback: string): Promise<Receivable> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getReceivableErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = receivableResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do recebível.');
  }

  return parsed.data;
}

async function requestReceivables(organizationId: string, params: ReceivableListParams): Promise<ReceivablePage> {
  const { page, status, customerId, limit, overdue, workOrderId } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit ?? DEFAULT_PAGE_LIMIT),
  });

  if (status !== 'ALL') {
    query.set('status', status);
  }

  if (customerId) {
    query.set('customerId', customerId);
  }

  if (workOrderId) {
    query.set('workOrderId', workOrderId);
  }

  if (overdue !== undefined) {
    query.set('overdue', String(overdue));
  }

  const response = await authenticatedFetch(`${receivablesPath(organizationId)}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getReceivableErrorMessage(response.status, 'Não foi possível carregar os recebíveis.'));
  }

  const payload: unknown = await response.json();

  const parsed = receivablesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os recebíveis.');
  }

  return parsed.data;
}

export function listReceivables(organizationId: string, params: ReceivableListParams): Promise<ReceivablePage> {
  const { page, status, customerId, limit, overdue, workOrderId } = params;

  const key = [
    organizationId,
    page,
    limit ?? DEFAULT_PAGE_LIMIT,
    status,
    customerId ?? '',
    workOrderId ?? '',
    overdue === undefined ? 'ALL' : String(overdue),
  ].join(':');

  const existing = receivableListFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestReceivables(organizationId, params);

  receivableListFlights.set(key, request);

  const cleanup = () => {
    if (receivableListFlights.get(key) === request) {
      receivableListFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function findReceivableByWorkOrderId(
  organizationId: string,
  workOrderId: string,
): Promise<Receivable | null> {
  const result = await listReceivables(organizationId, {
    page: 1,
    limit: 1,
    status: 'ALL',
    workOrderId,
  });

  return result.items[0] ?? null;
}

export async function createReceivableFromWorkOrder(
  organizationId: string,
  workOrderId: string,
  input: CreateReceivableInput,
): Promise<Receivable> {
  const response = await authenticatedFetch(receivablesPath(organizationId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workOrderId,
      ...input,
    }),
  });

  return readReceivable(response, 'Não foi possível criar o recebível.');
}

async function requestReceivable(organizationId: string, receivableId: string): Promise<Receivable> {
  const response = await authenticatedFetch(`${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}`);

  return readReceivable(response, 'Não foi possível carregar o recebível.');
}

export function getReceivable(organizationId: string, receivableId: string): Promise<Receivable> {
  const key = `${organizationId}:${receivableId}`;

  const existing = receivableFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestReceivable(organizationId, receivableId);

  receivableFlights.set(key, request);

  const cleanup = () => {
    if (receivableFlights.get(key) === request) {
      receivableFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function updateReceivable(
  organizationId: string,
  receivableId: string,
  version: number,
  input: UpdateReceivableInput,
): Promise<Receivable> {
  const response = await authenticatedFetch(`${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      ...input,
    }),
  });

  return readReceivable(response, 'Não foi possível atualizar o recebível.');
}

export async function cancelReceivable(
  organizationId: string,
  receivableId: string,
  version: number,
  reason: string,
): Promise<Receivable> {
  const response = await authenticatedFetch(
    `${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        reason,
      }),
    },
  );

  return readReceivable(response, 'Não foi possível cancelar o recebível.');
}

async function requestReceivablePayments(
  organizationId: string,
  receivableId: string,
  page: number,
): Promise<ReceivablePaymentsPage> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(PAYMENT_PAGE_LIMIT),
  });

  const response = await authenticatedFetch(
    `${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}/payments?${query.toString()}`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getReceivableErrorMessage(response.status, 'Não foi possível carregar os pagamentos.'));
  }

  const payload: unknown = await response.json();

  const parsed = receivablePaymentsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os pagamentos.');
  }

  return parsed.data;
}

export function listReceivablePayments(
  organizationId: string,
  receivableId: string,
  version: number,
  page: number,
): Promise<ReceivablePaymentsPage> {
  const key = `${organizationId}:${receivableId}:${version}:${page}`;

  const existing = paymentFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestReceivablePayments(organizationId, receivableId, page);

  paymentFlights.set(key, request);

  const cleanup = () => {
    if (paymentFlights.get(key) === request) {
      paymentFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

async function readPaymentResult(response: Response, fallback: string): Promise<ReceivablePaymentResult> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getReceivableErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = receivablePaymentResultResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o pagamento.');
  }

  return parsed.data;
}

export async function recordReceivablePayment(
  organizationId: string,
  receivableId: string,
  version: number,
  requestId: string,
  input: ReceivablePaymentInput,
): Promise<ReceivablePaymentResult> {
  const response = await authenticatedFetch(
    `${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}/payments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        requestId,
        ...input,
      }),
    },
  );

  return readPaymentResult(response, 'Não foi possível registrar o pagamento.');
}

export async function reverseReceivablePayment(
  organizationId: string,
  receivableId: string,
  paymentId: string,
  version: number,
  reason: string,
): Promise<ReceivablePaymentResult> {
  const response = await authenticatedFetch(
    `${receivablesPath(organizationId)}/${encodeURIComponent(receivableId)}/payments/${encodeURIComponent(paymentId)}/reverse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        reason,
      }),
    },
  );

  return readPaymentResult(response, 'Não foi possível estornar o pagamento.');
}

function currentMonthPeriod(): {
  from: string;
  to: string;
} {
  const now = new Date();

  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: new Date(now.getTime() + 1000).toISOString(),
  };
}

async function requestReceivableFinancial(organizationId: string): Promise<ReceivableFinancial> {
  const period = currentMonthPeriod();

  const query = new URLSearchParams(period);

  const response = await authenticatedFetch(
    `/api/organizations/${encodeURIComponent(organizationId)}/dashboard/financial?${query.toString()}`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar o resumo financeiro.');
  }

  const payload: unknown = await response.json();

  const parsed = receivableFinancialSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o resumo financeiro.');
  }

  return parsed.data;
}

export function getReceivableFinancial(organizationId: string): Promise<ReceivableFinancial> {
  const existing = financialFlights.get(organizationId);

  if (existing) {
    return existing;
  }

  const request = requestReceivableFinancial(organizationId);

  financialFlights.set(organizationId, request);

  const cleanup = () => {
    if (financialFlights.get(organizationId) === request) {
      financialFlights.delete(organizationId);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
