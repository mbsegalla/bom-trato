import { z } from 'zod';

import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const stateSchema = apiResponseSchema(
  z.object({
    step: z.enum([
      'CREATE_BUSINESS',
      'SELECT_PLAN',
      'PAYMENT',
      'PAYMENT_PENDING',
      'BILLING_REQUIRED',
      'BILLING_REVIEW',
      'APP',
      'CONTACT_OWNER',
    ]),
    organizationId: z.string().uuid().nullable(),
    selectedPlanPriceId: z.string().uuid().nullable(),
  }),
);

const organizationSchema = apiResponseSchema(
  z.object({
    id: z.string().uuid(),
  }),
);

export type OnboardingState = z.infer<typeof stateSchema>;

export async function getOnboarding(organizationId?: string): Promise<OnboardingState> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';

  const response = await authenticatedFetch(`/api/onboarding${query}`);

  if (response.status === 401) {
    throw new SessionError('Entre para continuar.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar a próxima etapa. Tente novamente.');
  }

  const payload: unknown = await response.json();
  const parsed = stateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível ler a próxima etapa. Tente novamente.');
  }

  return parsed.data;
}

export async function createBusiness(name: string, key: string): Promise<string> {
  const response = await authenticatedFetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ name }),
  });

  if (response.status === 401) {
    throw new SessionError('Entre para continuar.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível criar o negócio. Confira o nome e tente novamente.');
  }

  const payload: unknown = await response.json();
  const parsed = organizationSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não conseguimos confirmar o cadastro. Consulte sua conta antes de tentar novamente.');
  }

  return parsed.data.id;
}
