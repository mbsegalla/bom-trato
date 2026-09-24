import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  publicQuoteDecisionResponseSchema,
  publicQuoteResponseSchema,
  quoteResponseSchema,
  quoteShareResponseSchema,
  quoteShareTokenSchema,
  quotesResponseSchema,
  quoteStatusHistoryResponseSchema,
} from '../schemas/quote.schema';
import type {
  CreateQuoteInput,
  PublicQuote,
  PublicQuoteDecision,
  Quote,
  QuoteItemMutationInput,
  QuoteListParams,
  QuotePage,
  QuotePdfFile,
  QuoteShare,
  QuoteStatusHistory,
  UpdateQuoteInput,
} from '../types/quote.types';

const DEFAULT_PAGE_LIMIT = 10;

const quoteListFlights = new Map<string, Promise<QuotePage>>();
const quoteFlights = new Map<string, Promise<Quote>>();
const quoteHistoryFlights = new Map<string, Promise<QuoteStatusHistory[]>>();

function getQuoteErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'Confira os dados do orçamento e tente novamente.';

    case 403:
      return 'Você não tem permissão para realizar esta operação.';

    case 404:
      return 'Orçamento não encontrado.';

    case 409:
      return 'O orçamento foi alterado ou não permite esta operação. Recarregue os dados e tente novamente.';

    case 503:
      return 'Os orçamentos estão sendo atualizados. Tente novamente em instantes.';

    default:
      return fallback;
  }
}

function organizationQuotesPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/quotes`;
}

async function readQuote(response: Response, fallback: string): Promise<Quote> {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getQuoteErrorMessage(response.status, fallback));
  }

  const payload: unknown = await response.json();

  const parsed = quoteResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do orçamento.');
  }

  return parsed.data;
}

async function requestQuotes(organizationId: string, params: QuoteListParams): Promise<QuotePage> {
  const { page, status, customerId, limit } = params;

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

  const response = await authenticatedFetch(`${organizationQuotesPath(organizationId)}?${query.toString()}`);

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getQuoteErrorMessage(response.status, 'Não foi possível carregar seus orçamentos.'));
  }

  const payload: unknown = await response.json();

  const parsed = quotesResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar seus orçamentos.');
  }

  return parsed.data;
}

export function listQuotes(organizationId: string, params: QuoteListParams): Promise<QuotePage> {
  const { page, status, customerId, limit } = params;

  const key = `${organizationId}:${page}:${limit ?? DEFAULT_PAGE_LIMIT}:${status}:${customerId ?? ''}`;

  const existing = quoteListFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestQuotes(organizationId, params);

  quoteListFlights.set(key, request);

  const cleanup = () => {
    if (quoteListFlights.get(key) === request) {
      quoteListFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function createQuote(organizationId: string, input: CreateQuoteInput): Promise<Quote> {
  const response = await authenticatedFetch(organizationQuotesPath(organizationId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readQuote(response, 'Não foi possível criar o orçamento.');
}

async function requestQuote(organizationId: string, quoteId: string): Promise<Quote> {
  const response = await authenticatedFetch(`${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}`);

  return readQuote(response, 'Não foi possível carregar o orçamento.');
}

export function getQuote(organizationId: string, quoteId: string): Promise<Quote> {
  const key = `${organizationId}:${quoteId}`;

  const existing = quoteFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestQuote(organizationId, quoteId);

  quoteFlights.set(key, request);

  const cleanup = () => {
    if (quoteFlights.get(key) === request) {
      quoteFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function updateQuote(
  organizationId: string,
  quoteId: string,
  version: number,
  input: UpdateQuoteInput,
): Promise<Quote> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...input,
        version,
      }),
    },
  );

  return readQuote(response, 'Não foi possível atualizar o orçamento.');
}

export async function addQuoteItem(
  organizationId: string,
  quoteId: string,
  input: QuoteItemMutationInput,
): Promise<Quote> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  return readQuote(response, 'Não foi possível adicionar o item.');
}

export async function replaceQuoteItem(
  organizationId: string,
  quoteId: string,
  itemId: string,
  input: QuoteItemMutationInput,
): Promise<Quote> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  return readQuote(response, 'Não foi possível atualizar o item.');
}

export async function removeQuoteItem(
  organizationId: string,
  quoteId: string,
  itemId: string,
  version: number,
): Promise<Quote> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
      }),
    },
  );

  return readQuote(response, 'Não foi possível remover o item.');
}

async function transitionQuote(
  organizationId: string,
  quoteId: string,
  action: 'send' | 'approve' | 'decline' | 'cancel',
  version: number,
): Promise<Quote> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/${action}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
      }),
    },
  );

  return readQuote(response, 'Não foi possível atualizar o status do orçamento.');
}

export function sendQuote(organizationId: string, quoteId: string, version: number): Promise<Quote> {
  return transitionQuote(organizationId, quoteId, 'send', version);
}

export function approveQuote(organizationId: string, quoteId: string, version: number): Promise<Quote> {
  return transitionQuote(organizationId, quoteId, 'approve', version);
}

export function declineQuote(organizationId: string, quoteId: string, version: number): Promise<Quote> {
  return transitionQuote(organizationId, quoteId, 'decline', version);
}

export function cancelQuote(organizationId: string, quoteId: string, version: number): Promise<Quote> {
  return transitionQuote(organizationId, quoteId, 'cancel', version);
}

async function requestQuoteStatusHistory(organizationId: string, quoteId: string): Promise<QuoteStatusHistory[]> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/status-history`,
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    throw new Error(getQuoteErrorMessage(response.status, 'Não foi possível carregar o histórico do orçamento.'));
  }

  const payload: unknown = await response.json();

  const parsed = quoteStatusHistoryResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o histórico do orçamento.');
  }

  return parsed.data;
}

export function getQuoteStatusHistory(
  organizationId: string,
  quoteId: string,
  version: number,
): Promise<QuoteStatusHistory[]> {
  const key = `${organizationId}:${quoteId}:${version}`;

  const existing = quoteHistoryFlights.get(key);

  if (existing) {
    return existing;
  }

  const request = requestQuoteStatusHistory(organizationId, quoteId);

  quoteHistoryFlights.set(key, request);

  const cleanup = () => {
    if (quoteHistoryFlights.get(key) === request) {
      quoteHistoryFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

function readFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get('content-disposition');

  const match = disposition?.match(/filename="([^"]+)"/i);

  return match?.[1] ?? fallback;
}

async function readPdf(response: Response, fallback: string): Promise<QuotePdfFile> {
  if (!response.ok) {
    throw new Error(getQuoteErrorMessage(response.status, 'Não foi possível gerar o PDF.'));
  }

  return {
    blob: await response.blob(),
    filename: readFilename(response, fallback),
  };
}

export async function downloadQuotePdf(organizationId: string, quoteId: string): Promise<QuotePdfFile> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/pdf`,
  );

  return readPdf(response, 'orcamento.pdf');
}

export async function createQuoteShare(
  organizationId: string,
  quoteId: string,
  version: number,
  expiresAt: string,
): Promise<QuoteShare> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/share`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        expiresAt,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(getQuoteErrorMessage(response.status, 'Não foi possível gerar o link do orçamento.'));
  }

  const payload: unknown = await response.json();

  const parsed = quoteShareResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o link do orçamento.');
  }

  return parsed.data;
}

export async function revokeQuoteShare(organizationId: string, quoteId: string): Promise<void> {
  const response = await authenticatedFetch(
    `${organizationQuotesPath(organizationId)}/${encodeURIComponent(quoteId)}/share`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(getQuoteErrorMessage(response.status, 'Não foi possível revogar o link.'));
  }
}

async function publicQuoteFetch(path: string, body: object): Promise<Response> {
  const { baseUrl, timeoutMs } = getApiConfig();

  return fetch(new URL(path, baseUrl), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function resolvePublicQuote(token: string): Promise<PublicQuote> {
  if (!quoteShareTokenSchema.safeParse(token).success) {
    throw new Error('O link do orçamento é inválido.');
  }

  const response = await publicQuoteFetch('/api/public/quotes/resolve', {
    token,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404 ? 'Este link não está mais disponível.' : 'Não foi possível carregar o orçamento.',
    );
  }

  const payload: unknown = await response.json();

  const parsed = publicQuoteResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o orçamento.');
  }

  return parsed.data;
}

export async function decidePublicQuote(
  token: string,
  version: number,
  decision: 'approve' | 'decline',
): Promise<PublicQuoteDecision> {
  const response = await publicQuoteFetch(`/api/public/quotes/${decision}`, {
    token,
    version,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? 'Este orçamento já foi alterado ou decidido.'
        : 'Não foi possível registrar sua resposta.',
    );
  }

  const payload: unknown = await response.json();

  const parsed = publicQuoteDecisionResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a confirmação.');
  }

  return parsed.data;
}

export async function downloadPublicQuotePdf(token: string): Promise<QuotePdfFile> {
  const response = await publicQuoteFetch('/api/public/quotes/pdf', {
    token,
  });

  return readPdf(response, 'orcamento.pdf');
}
