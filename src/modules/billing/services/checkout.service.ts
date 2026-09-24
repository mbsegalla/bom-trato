import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';

import { type CheckoutResponse, checkoutResponseSchema } from '../schemas/checkout.schema';

const checkoutFlights = new Map<string, Promise<CheckoutResponse>>();

function getCheckoutErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Os dados do pagamento são inválidos.';

    case 403:
      return 'Você não tem permissão para iniciar este pagamento.';

    case 404:
      return 'Não foi possível encontrar o negócio para iniciar o pagamento.';

    case 409:
      return 'Já existe uma operação de pagamento em andamento ou a assinatura não permite um novo pagamento.';

    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.';

    case 503:
      return 'O pagamento está sendo preparado. Tente novamente em instantes.';

    default:
      return 'Não foi possível iniciar o pagamento. Tente novamente.';
  }
}

async function requestCheckout(organizationId: string, planPriceId: string): Promise<CheckoutResponse> {
  const response = await authenticatedFetch(
    `/api/organizations/${encodeURIComponent(organizationId)}/billing/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planPriceId,
      }),
    },
  );

  if (response.status === 401) {
    throw new SessionError('Sua sessão expirou. Entre novamente para continuar.', 401);
  }

  if (!response.ok) {
    throw new Error(getCheckoutErrorMessage(response.status));
  }

  const payload: unknown = await response.json();

  const parsed = checkoutResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar os dados do pagamento.');
  }

  return parsed.data;
}

export function startCheckout(organizationId: string, planPriceId: string): Promise<CheckoutResponse> {
  const key = `${organizationId}:${planPriceId}`;

  const existingFlight = checkoutFlights.get(key);

  if (existingFlight) {
    return existingFlight;
  }

  const request = requestCheckout(organizationId, planPriceId);

  checkoutFlights.set(key, request);

  const cleanup = () => {
    if (checkoutFlights.get(key) === request) {
      checkoutFlights.delete(key);
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}
