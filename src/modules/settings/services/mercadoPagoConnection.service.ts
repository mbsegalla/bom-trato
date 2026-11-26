import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import {
  mercadoPagoCompletionResponseSchema,
  mercadoPagoConnectionResponseSchema,
  mercadoPagoStartResponseSchema,
} from '../schemas/mercadoPagoConnection.schema';
import type {
  MercadoPagoCompletionView,
  MercadoPagoConnectionView,
  MercadoPagoStartView,
} from '../types/mercadoPagoConnection.types';

function connectionPath(organizationId: string): string {
  return `/api/organizations/${encodeURIComponent(organizationId)}/mercado-pago/connection`;
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente e inicie uma nova conexão.', 401);
  }

  switch (response.status) {
    case 400:
      throw new Error('A autorização é inválida, expirou ou já foi utilizada. Inicie uma nova conexão.');

    case 403:
      throw new Error('Somente o proprietário autorizado pode conectar esta conta.');

    case 409:
      throw new Error('Esta conta não pode ser vinculada. Reconecte a conta anteriormente cadastrada neste negócio.');

    case 503:
      throw new Error('A conexão com Mercado Pago está indisponível. Confira o status e inicie novamente.');

    default:
      throw new Error('Não foi possível confirmar a conexão. Confira o status antes de tentar novamente.');
  }
}

export async function getMercadoPagoConnection(organizationId: string): Promise<MercadoPagoConnectionView> {
  const response = await authenticatedFetch(connectionPath(organizationId));

  await assertOk(response);

  const parsed = mercadoPagoConnectionResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar o status da conexão.');
  }

  return parsed.data;
}

export async function startMercadoPagoConnection(organizationId: string): Promise<MercadoPagoStartView> {
  const response = await authenticatedFetch(`${connectionPath(organizationId)}/start`, { method: 'POST' });

  await assertOk(response);

  const parsed = mercadoPagoStartResponseSchema.safeParse(await response.json());

  if (!parsed.success || parsed.data.expiresAt.getTime() <= Date.now()) {
    throw new Error('Não foi possível iniciar a autorização.');
  }

  const url = new URL(parsed.data.authorizationUrl);
  const callback = new URL('/mercado-pago/callback', window.location.origin).toString();

  if (
    url.origin !== 'https://auth.mercadopago.com' ||
    url.pathname !== '/authorization' ||
    url.username ||
    url.password ||
    url.hash ||
    url.searchParams.get('redirect_uri') !== callback ||
    url.searchParams.get('response_type') !== 'code' ||
    url.searchParams.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('state') ?? '') ||
    !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge') ?? '')
  ) {
    throw new Error('Não foi possível confirmar o endereço de autorização do Mercado Pago.');
  }

  return parsed.data;
}

export async function completeMercadoPagoConnection(state: string, code: string): Promise<MercadoPagoCompletionView> {
  const response = await authenticatedFetch('/api/mercado-pago/connection/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, code }),
  });

  await assertOk(response);

  const parsed = mercadoPagoCompletionResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error('Não foi possível confirmar o resultado. Consulte a configuração de recebimentos.');
  }

  return parsed.data;
}

export async function disconnectMercadoPagoConnection(organizationId: string): Promise<void> {
  const response = await authenticatedFetch(connectionPath(organizationId), { method: 'DELETE' });

  await assertOk(response);
}
