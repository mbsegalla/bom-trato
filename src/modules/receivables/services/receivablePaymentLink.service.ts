import { getApiConfig } from '@/config/api.config';
import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  createdReceivablePaymentLinkResponseSchema,
  publicReceivablePaymentLinkResponseSchema,
  receivablePaymentLinkStatusResponseSchema,
} from '../schemas/receivablePaymentLink.schema';
import type {
  CreatedReceivablePaymentLink,
  PublicReceivablePaymentLink,
  ReceivablePaymentLinkStatus,
} from '../types/receivablePaymentLink.types';

function path(organizationId: string, receivableId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/receivables/${encodeURIComponent(receivableId)}/payment-link`;
}

function assertOk(response: Response): void {
  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente.', 401);
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Confira o saldo atualizado e os dados Pix cadastrados antes de gerar o link.');
    }

    if (response.status === 403) {
      throw new Error('Somente o proprietário autorizado pode gerenciar links de pagamento.');
    }

    throw new Error('Não foi possível gerenciar o link de pagamento. Tente novamente.');
  }
}

export async function getReceivablePaymentLinkStatus(
  organizationId: string,
  receivableId: string,
): Promise<ReceivablePaymentLinkStatus | null> {
  const response = await authenticatedFetch(path(organizationId, receivableId));

  assertOk(response);

  const parsed = receivablePaymentLinkStatusResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o status do link.');
  }

  return parsed.data;
}

export async function createReceivablePaymentLink(
  organizationId: string,
  receivableId: string,
  version: number,
): Promise<CreatedReceivablePaymentLink> {
  const response = await authenticatedFetch(path(organizationId, receivableId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version }),
  });

  assertOk(response);

  const parsed = createdReceivablePaymentLinkResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error('Não foi possível confirmar o link gerado.');
  }

  const url = new URL(parsed.data.url);
  const token = new URLSearchParams(url.hash.slice(1)).get('token') ?? '';

  if (
    url.origin !== window.location.origin ||
    url.pathname !== '/pagar' ||
    url.search ||
    url.username ||
    url.password ||
    !/^[a-f0-9]{64}$/.test(token) ||
    url.hash !== `#token=${token}`
  ) {
    throw new Error('Não foi possível confirmar o endereço do link gerado.');
  }

  return parsed.data;
}

export async function revokeReceivablePaymentLink(organizationId: string, receivableId: string): Promise<void> {
  const response = await authenticatedFetch(path(organizationId, receivableId), { method: 'DELETE' });

  assertOk(response);
}

export async function resolveReceivablePaymentLink(token: string): Promise<PublicReceivablePaymentLink> {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new Error('Link de pagamento indisponível. Solicite um novo link ao profissional.');
  }

  const { baseUrl, timeoutMs } = getApiConfig();
  const response = await fetch(new URL('/api/public/receivable-payment-links/resolve', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? 'Muitas tentativas. Tente novamente em alguns instantes.'
        : 'Link de pagamento indisponível. Solicite um novo link ao profissional.',
    );
  }

  const parsed = publicReceivablePaymentLinkResponseSchema.safeParse(await response.json());

  if (!parsed.success || parsed.data.expiresAt.getTime() <= Date.now()) {
    throw new Error('Link de pagamento indisponível. Solicite um novo link ao profissional.');
  }

  return parsed.data;
}
