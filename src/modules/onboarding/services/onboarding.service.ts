import { z } from 'zod';

import { authenticatedFetch, SessionError } from '@/modules/auth/services/session.service';
import { apiResponseSchema } from '@/shared/schemas/apiResponse.schema';

const onboardingStateSchema = apiResponseSchema(
  z.object({
    step: z.enum([
      'PROVISIONING',
      'SELECT_PLAN',
      'PAYMENT',
      'PAYMENT_PENDING',
      'BILLING_REQUIRED',
      'BILLING_REVIEW',
      'CREATE_BUSINESS',
      'APP',
      'CONTACT_OWNER',
    ]),
    organizationId: z.uuid().nullable(),
    selectedPlanPriceId: z.uuid().nullable(),
  }),
);

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

let bootstrapFlight: Promise<OnboardingState> | null = null;

async function readOnboardingState(response: Response): Promise<OnboardingState> {
  if (response.status === 401) {
    throw new SessionError('Entre para continuar.', 401);
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar a próxima etapa. Tente novamente.');
  }

  const payload: unknown = await response.json();

  const parsed = onboardingStateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error('Não foi possível interpretar a próxima etapa.');
  }

  return parsed.data;
}

async function requestBootstrap(): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/bootstrap', {
    method: 'POST',
  });

  return readOnboardingState(response);
}

export function bootstrapOnboarding(): Promise<OnboardingState> {
  if (bootstrapFlight) {
    return bootstrapFlight;
  }

  const request = requestBootstrap();

  bootstrapFlight = request;

  const cleanup = () => {
    if (bootstrapFlight === request) {
      bootstrapFlight = null;
    }
  };

  void request.then(cleanup, cleanup);

  return request;
}

export async function getOnboarding(organizationId?: string): Promise<OnboardingState> {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';

  const response = await authenticatedFetch(`/api/onboarding${query}`);

  return readOnboardingState(response);
}

export async function selectOnboardingPlan(organizationId: string, planPriceId: string): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      planPriceId,
    }),
  });

  return readOnboardingState(response);
}

export async function completeBusinessSetup(organizationId: string, name: string): Promise<OnboardingState> {
  const response = await authenticatedFetch('/api/onboarding/business', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId,
      name,
    }),
  });

  return readOnboardingState(response);
}
